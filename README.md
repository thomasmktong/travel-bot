Travel Bot
==========
by Anson Tong, Catalina Leung, Keith Lam, [Thomas Tong](http://thomastong.me/)

In March 2017, we participated in the Hong Kong First Bot Hackathon organised by [Recime.io](https://recime.io/). We built a chat bot travel assistant which suggests tourist attractions and finds cheapest flight tickets. We became the 1st runner-up in the event.

[Photo 1](https://twitter.com/thomasmktong/status/838347846663426049), [Photo 2](https://twitter.com/thomasmktong/status/838395615134400512), [Photos by Recime](https://twitter.com/GetRecime/status/838463271128596483)

This chat bot uses [Recime.io](https://recime.io/) as backend service, [API.AI](https://api.ai/) for Natural language processing (NLP) and [Botimize.io](http://www.botimize.io/) for analytics service. It also uses [Yelp](http://yelp.com/) and [Skyscanner](skyscanner.com)'s APIs to retrieve tourist attractions and flight ticket information.

While The original bot is integrated with both Facebook Messenger and Google Home, we decided to further fine tune the user experience for Facebook Messager and release it as an open-source project.

This project serves as one of the complete examples for setting up a full-feature chat bot on the Facebook Messenger platform. Please submit an issue if there are any questions. Pull requests are also welcome.

## Try It

- [@thetravelbot](https://www.facebook.com/thetravelbot/) - Travel Bot Page in Facebook
- You can start with keywords or phases like "attractions in London", or "flight ticket to San Francisco"

## Setup Guide

### Architecture

```
+-----------+     +----------+     +------------+
| Facebook  |     |Recime.io |     | API.AI     |
| Messenger +----->Webhook   +-----> NLP Service|
+-----------+     +-----+----+     +------------+
                        |
                        |          +------------+
                        +----------> Skyscanner |
                        |          +------------+
                        |
                        |          +------------+
                        +----------> Yelp       |
                                   +------------+
```
*-- Chart by [Asciiflow](http://asciiflow.com/)*

### Facebook Messenger App

1. Navigate to [Facebook for developers](https://developers.facebook.com/) page
2. Create a new Facebook App, for the App **Category**, select **Apps for Messenger**
3. Under the **Products** > **Messenger** page > **Token Generation** section, select one of your Facebook page(s) that you want to chat bot to serve in. A popup will ask you to verify permissions for the app
4. Copy the **Page Access Token**

### API.AI

1. Login to [API.AI](https://api.ai/)
2. Create a new agent, then click the **Gear** icon to go to settings page.
3. Copy the **Client access token**
4. Navigate to **Export and Import** tab 
5. Zip the `api.ai.settings` folder in this repository, then click **Import from Zip** and upload the file

### Skyscanner

1. Login to [Skyscanner Business Portal](http://en.business.skyscanner.net/)
2. Create a new app, then copy the **API Key**

### Yelp

1. Login to [Yelp Fusion](https://en.yelp.com.hk/developers)
2. Create a new app, then copy its **Customer Key**, **Customer Secret**, **Token** and **Token Secret**

### Botimize.io

1. Login to [Botimize.io](http://www.botimize.io/)
2. Create a new project, then copy the **API Key** from the **Project Settings** page

### Recime.io

1. Initialize the Recime CLI with `recime-cli login`, type in your login email and password
2. Clone this repository
3. Add the copied keys into `./recime/config.json` by the following commands:

```
$ recime-cli platform config facebook
Page access token: XXX

$ recime-cli plugins add botimize --apikey XXX
$ recime-cli config set SKYSCANNER_API_KEY=XXX
$ recime-cli config set YELP_CONSUMER_KEY=XXX
$ recime-cli config set YELP_CONSUMER_SECRET=XXX
$ recime-cli config set YELP_TOKEN=XXX
$ recime-cli config set YELP_SECRET=XXX
```

4. Deploy the repository with `recime-cli deploy`, copy the URL address of the **API endpoint**
5. Login to [Recime.io](https://recime.io/)'s website, then click on the project just deployed, copy the **Verify Token**
6. Switch on **Enable Entities Extraction**, select **API.AI**, then paste your agent's **Client access token**
7. Click **Choose** button to confirm

### Facebook App Domain Whitelisting

1. We have to whitelist the domains of Yelp and Skyscanner, so that Messenger can display these links to users
2. Navigate to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
3. Select your Facebook App for the **Application** drop down box
4. Select you Page for the **Page Access Tokens** drop down box
5. Select "Post" in the URL box, then type in `me/thread_settings` as the URL
6. Paste the following JSON in content box, then click **Submit** button

```javascript
{
    "setting_type": "domain_whitelisting",
    "whitelisted_domains": [
        "https://www.yelp.com/",
        "http://partners.api.skyscanner.net/"
    ],
    "domain_action_type": "add"
}
```

### Facebook Webhook

1. Navigate to [Facebook for developers](https://developers.facebook.com/) page
2. Select the Facebook App, under the **Products** > **Messenger** page > **Webhooks** section, click the **Setup Webhooks** button
3. Paste the Recime project's deployed **API endpoint** and **Verify Token** to the fields
4. Select **message_deliveries**, **messages**, **messaging_optins**, **messaging_postbacks** under **Subscription Fields**
5. Once you set the webhook, the settings will be moved to **Products** > **Webhooks** page
6. You should be able to test your chat bot now, go to **Roles** page to add testers, or go to **App Review** page to publish the App

## Platform Limitations

- [Message Templates](https://developers.facebook.com/docs/messenger-platform/send-api-reference/templates) provided by Facebook is extremely not flexible by mandating values in almost all the fields. The templates are also not consistent. For example, developer can add buttons at the end of the [List Template](https://developers.facebook.com/docs/messenger-platform/send-api-reference/list-template), but not in the [Airline Itinerary Template](https://developers.facebook.com/docs/messenger-platform/send-api-reference/airline-itinerary-template). Conversely, an intro message cannot be added to the prior template but can be added to the latter.
- [Recime.io](https://recime.io/) is easy to use. But at this moment, it only supports one respond message or template for each user message. Combining with the limitations of Facebook Messenger, results in a suboptimal user experience. It also limits the processing time of the code to be less than 10 seconds.

## Related Projects

- [node-skyscanner-live](https://github.com/thomasmktong/node-skyscanner-live) - Node.js module to poll skyscanner live prices

## More Details

- [Recime.io Documentation](https://docs.recime.io/)
- [Facebook Messenger - Send API Reference](https://developers.facebook.com/docs/messenger-platform/send-api-reference)
- [Facebook App - Domain Whitelisting Reference](https://developers.facebook.com/docs/messenger-platform/thread-settings/domain-whitelisting)
- [Skyscanner API Documentation](https://skyscanner.github.io/slate/)
- [Yelp API Documention](https://www.yelp.com/developers/documentation/)

<hr />

This work is released under the [MIT License](https://github.com/thomasmktong/travel-bot/blob/master/LICENSE.txt) - [Privacy Policy](https://github.com/thomasmktong/travel-bot/blob/master/PRIVACY_POLICY.md) - [Terms of Service](https://github.com/thomasmktong/travel-bot/blob/master/TERMS_OF_SERVICES.md)
