/// <reference path="node.d.ts" />

import async = require('async');
import util = require('util');
import lodash = require('lodash');
import chrono = require('chrono-node');
import dateFormat = require('dateformat');
import leftPad = require('left-pad');
import skyscanner = require('node-skyscanner-live');
import Yelp = require('yelp');

skyscanner.setApiKey(process.env.SKYSCANNER_API_KEY);

var yelp = new Yelp({
  consumer_key: process.env.YELP_CONSUMER_KEY,
  consumer_secret: process.env.YELP_CONSUMER_SECRET,
  token: process.env.YELP_TOKEN,
  token_secret: process.env.YELP_SECRET,
});

export class Bot {

  private args: any;

  constructor(args: Object) {
    this.args = args;
  }

  get extract() {
    return "message.text";
  }

  execute(cb: any) {
    let responded = false;
    let args = this.args;
    let result = null;

    // Text input processed by API.ai
    if (args.apiai) result = args.apiai.result;

    // Facebook button postback
    if (args.postback && args.postback.payload) result = JSON.parse(args.postback.payload);

    if (result) {
      if (result.metadata.intentName === 'find_attractions') {

        var geoCity = result.parameters['geo-city'];
        if (geoCity) {
          yelp.search({ location: geoCity, category_filter: 'landmarks' }).then(function (data) {

            var elements = lodash.sampleSize(data.businesses, 4).map(function (biz) {

              var secondaryInfo = null;
              if (!secondaryInfo && biz.location && biz.location.display_address) secondaryInfo = biz.location.display_address;
              if (!secondaryInfo && biz.location && biz.location.address) secondaryInfo = biz.location.address;

              return {
                title: biz.name,
                image_url: biz.image_url,
                subtitle: biz.rating + '/5. ' + secondaryInfo,
                default_action: {
                  type: "web_url",
                  url: biz.url,
                  messenger_extensions: true,
                  webview_height_ratio: "tall"
                }
              };
            });

            cb({
              attachment: {
                type: "template",
                payload: {
                  "template_type": "list",
                  "top_element_style": "large",
                  "elements": elements,
                  "buttons": [{
                    "title": "View More",
                    "type": "postback",
                    "payload": JSON.stringify(result)
                  }]
                }
              }
            });
          });

          responded = true;
        }
      } else if (result.metadata.intentName === 'find_flights') {

        var toGeoCity = result.parameters['to-geo-city'];
        var fromGeoCity = result.parameters['from-geo-city'];
        var departDate = result.parameters['depart-date'];
        var returnDate = result.parameters['return-date'];
        var waitQueue = [];

        if (toGeoCity && departDate && returnDate) {

          waitQueue.push(skyscanner.getLocation(toGeoCity).then(function (data) {
            if (data && Array.isArray(data)) toGeoCity = data[0].id;
          }));

          if (fromGeoCity) {
            waitQueue.push(skyscanner.getLocation(fromGeoCity).then(function (data) {
              if (data && Array.isArray(data)) {
                fromGeoCity = data[0].id;
              } else {
                fromGeoCity = null;
              }
            }));
          }

          departDate = dateFormat(chrono.parseDate(departDate), 'yyyy-mm-dd');
          returnDate = dateFormat(chrono.parseDate(returnDate), 'yyyy-mm-dd');

          if (!fromGeoCity) {
            fromGeoCity = 'HKG-sky'
          }

          var placeholderText = 'X';
          Promise.all(waitQueue).then(function () {

            skyscanner.search(fromGeoCity, toGeoCity, departDate, returnDate, 1, 0, 0, true).then(function (data) {
              var data = data[0];

              var flightInfos = data.segments.map(function (segment, index) {
                var group = leftPad(segment.group, 3, '0');
                var id = leftPad(index, 3, '0');

                return {
                  "connection_id": "c" + group,
                  "segment_id": "s" + id,
                  "flight_number": segment.carrier.join(', '),
                  "travel_class": "economy",
                  "departure_airport": {
                    "airport_code": segment.departAirport.code,
                    "city": segment.departCity.name,
                  },
                  "arrival_airport": {
                    "airport_code": segment.arriveAirport.code,
                    "city": segment.arriveCity.name,
                  },
                  "flight_schedule": {
                    "departure_time": segment.departTime,
                    "arrival_time": segment.arriveTime,
                  }
                };
              });

              cb({
                attachment: {
                  type: "template",
                  payload: {
                    "template_type": "airline_itinerary",
                    "intro_message": "Here\'s my suggesion: " + data.url,
                    "locale": "en_US",
                    "pnr_number": placeholderText,
                    "passenger_info": [
                      {
                        "name": "1 Adult",
                        "passenger_id": "p001"
                      }
                    ],
                    "flight_info": flightInfos,
                    "passenger_segment_info": flightInfos.map(function (flightInfo) {
                      return {
                        "segment_id": flightInfo.segment_id,
                        "passenger_id": "p001",
                        "seat": placeholderText,
                        "seat_type": placeholderText
                      }
                    }),
                    "price_info": [],
                    "total_price": data.price,
                    "currency": "HKD"
                  }
                }
              });
            });
          });

          responded = true;
        }
      }
    }

    // if not handled here, use fulfillment set in api.ai
    if (!result.fulfillment || !result.fulfillment.speech) {
      result.fulfillment = { speech: 'Sorry. I got an error. Let\'s chat again!' }
    }

    if (!responded) {
      cb({
        text: result.fulfillment.speech
      });
    }
  }
}
