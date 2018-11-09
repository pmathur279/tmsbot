// Import required Bot Framework classes.
const { ActivityTypes } = require('botbuilder');
const { CardFactory } = require('botbuilder');
const path = require('path');
const bodyParser = require('body-parser');
// Import required bot services. See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, UserState, MemoryStorage, ConversationState } = require('botbuilder');
// Import required bot configuration.
const { BotConfiguration } = require('botframework-config');

var https = require('https');
var request = require('request');


//EXPRESS SERVER
const express = require('express');
var app = express();
const port = 3979;

var request = require('request');

// Import required bot services. See https://aka.ms/bot-services to learn more about the different parts of a bot.
// const { BotFrameworkAdapter, UserState, MemoryStorage, ConversationState } = require('botbuilder');

// const { WelcomeBot } = require('./bot');

var memoryStorage = new MemoryStorage();
var memoryStorage1 = new MemoryStorage();
userState = new UserState(memoryStorage);
conversationState = new ConversationState(memoryStorage1);

// const bot = new WelcomeBot(conversationState, userState);

app.listen(port, () => {
    console.log(`Server started`);
});

app.post('/api', (req, res) => {
    console.log(res);
    request.post('https://57e771fc.ngrok.io/api/messages', (err, response, body) => {
        console.log(body);
    });

    res.send(`Received Data`);
});

//EXPRESS SERVER END


const ENV_FILE = path.join(__dirname, '.env');
const env = require('dotenv').config({ path: ENV_FILE });

// Get the .bot file path
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
const BOT_FILE = path.join(__dirname, (process.env.botFilePath || ''));
let botConfig;
try {
    // Read bot configuration from .bot file.
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.error(`\nError reading bot file. Please ensure you have valid botFilePath and botFileSecret set for your environment.`);
    console.error(`\n - The botFileSecret is available under appsettings for your Azure Bot Service bot.`);
    console.error(`\n - If you are running this bot locally, consider adding a .env file with botFilePath and botFileSecret.`);
    console.error(`\n - See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.\n\n`);
    process.exit();
}

// For local development configuration as defined in .bot file
const DEV_ENVIRONMENT = 'development';

// Define name of the endpoint configuration section from the .bot file
const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);

// Get bot endpoint configuration by service name
// Bot configuration as defined in .bot file
const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);

// Create bot adapter.
// See https://aka.ms/about-bot-adapter to learn more about bot adapter.
const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
});

// Catch-all for any unhandled errors in your bot.
adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    context.sendActivity(`Oops. Something went wrong!`);
    // Clear out state
    await userState.clear(context);
    // Save state changes.
    await userState.saveChanges(context);
};

let membersList;
let access_token;
// Adaptive Card content
const IntroCard = require('./resources/IntroCard.json');

// Welcomed User property name
const WELCOMED_USER = 'welcomedUserProperty';
const BUTTON_CLICKED = 'buttonClickedProperty';
const CONTEXT_STATE = 'contextStateProperty';

var temp = false;

class WelcomeBot {
    /**
     *
     * @param {UserState} User state to persist boolean flag to indicate
     *                    if the bot had already welcomed the user
     */
    
    /**
     *
     * @param {ConversationState} User state to persist boolean flag to indicate
     *                    if the bot had already welcomed the user
     */


    constructor(conversationState, userState) {
        // Creates a new user property accessor.
        this.welcomedUserProperty = userState.createProperty(WELCOMED_USER);
        this.buttonClickedProperty = conversationState.createProperty(BUTTON_CLICKED);
        this.contextState = conversationState.createProperty(CONTEXT_STATE);
        this.userState = userState;
        this.conversationState = conversationState;
        this.membersList = membersList;
    }
    /**
     *
     * @param {TurnContext} context on turn context object.
     */
    async onTurn(turnContext, data) {
                
        console.log(turnContext);
        if(data !== null) {
            console.log(`received data `+ JSON.stringify(data));
            
            // var turnContext = this.conversationState.context;
            // console.log("Inside typeofdata : " + JSON.stringify(turnContext));
            turnContext.activity.text = '<at>mytmsbot</at> salesforce';
        }

        
        await this.getMemberData(turnContext);

        if(turnContext.activity.type === ActivityTypes.Invoke){
            const wasButtonClicked = await this.buttonClickedProperty.get(turnContext, false);
            if(wasButtonClicked === false){
                await this.buttonClickedProperty.set(turnContext, true);  

                for(var i=0; i< membersList.length; i++){
                    if(membersList[i].id === turnContext.activity.from.id){
                        await turnContext.sendActivity(`${ turnContext.activity.from.name }  with email address ${membersList[i].email } clicked the button!`); 
                    }
                }

                // await turnContext.sendActivity(`${ turnContext.activity.from.name } clicked the button!`);   
                await this.conversationState.saveChanges(turnContext);                 
            }
            else {
                await turnContext.sendActivity(`Button already clicked!`);
            }
        }
        else if (turnContext.activity.type === ActivityTypes.Message) {
            
            // Read UserState. If the 'DidBotWelcomedUser' does not exist (first time ever for a user)
            // set the default to false.
            const didBotWelcomedUser = await this.welcomedUserProperty.get(turnContext, false);

            // Your bot should proactively send a welcome message to a personal chat the first time
            // (and only the first time) a user initiates a personal chat with your bot.
            if (didBotWelcomedUser === false) {
                // The channel should send the user name in the 'From' object
                let userName = turnContext.activity.from.name;

                // await this.getMemberData(turnContext);

                await turnContext.sendActivity('You are seeing this message because this was your first message ever sent to this bot.');
                await turnContext.sendActivity(`text was ` + turnContext.activity.text);
                await turnContext.sendActivity(`It is a good practice to welcome the user and provide personal greeting. For example, welcome ${ userName }.`);

                // Set the flag indicating the bot handled the user's first message.
                await this.welcomedUserProperty.set(turnContext, true);
            } else {
                // This example uses an exact match on user's input utterance.
                // Consider using LUIS or QnA for Natural Language Processing.
                var text = turnContext.activity.text.toLowerCase();
                if(turnContext.activity.conversation['conversationType'] === 'personal'){
                    console.log('personal');
                }
                else{
                    var msg = text;
                    text = msg.slice(18, msg.length);
                    text=text.trim();
                }
                switch (text) {
                case 'hello':
                case 'hi':
                    console.log("in here");
                    await turnContext.sendActivity("You said "+text);
                    break;
                case 'leads':
                    // setInterval(function() {
                        
                    // }, 1000);
                    
                    // var members = await this.getMembers(turnContext);
                    // await turnContext.sendActivity(`members are ${JSON.stringify(members)}`);

                    break;

                case 'salesforce':
                    var sfdata = JSON.stringify(turnContext.activity.data);
                    await turnContext.sendActivity(`Salesforce data received!`);
                    await turnContext.sendActivity(`Data is ${sfdata}`)
                    await turnContext.sendActivity({
                        text: 'Salesforce Lead Data',
                        attachments: [{
                            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                            "type": "AdaptiveCard",
                            "version": "1.0",
                            "body": [
                              {
                                "type": "Image",
                                "url": "https://www.totalmortgage.com/images/logos/tmslogo.png",
                                "size": "stretch"
                              },
                              {
                                "type": "TextBlock",
                                "spacing": "medium",
                                "size": "default",
                                "weight": "bolder",
                                "text": "Welcome to TMS Bot!",
                                "wrap": true,
                                "maxLines": 0
                              },
                              {
                                "type": "TextBlock",
                                "size": "default",
                                "isSubtle": true,
                                "text": "Welcome to Welcome Users bot sample! This Introduction card is a great way to introduce your Bot to the user and suggest some things to get them started. We use this opportunity to recommend a few next steps for learning more creating and deploying bots.",
                                "wrap": true,
                                "maxLines": 0
                              }
                            ],
                            "actions": [
                              {
                                "type": "Action.Submit",
                                "title": "Test here",
                                "data": {
                                    "msteams": {
                                      "type": "invoke",
                                      "displayText": "button clicked",
                                      "text": "text to bots",
                                      "value": "{\"invokeValue\": \"Good\"}"
                                  }
                                }
                              },
                              {
                                "type": "Action.Submit",
                                "title": "Second Test",
                                "value": 
                                  {
                                    "name": "User"
                                  }
                              }
                            ]
                          }]
                    })
                    break;
                case 'intro':
                case 'help':
                    await turnContext.sendActivity(`members are ${membersList}`);
                    await turnContext.sendActivity({
                        text: 'Intro Adaptive Card',
                        attachments: [CardFactory.adaptiveCard(IntroCard)]
                    });
                    // await turnContext.sendActivity("${ userName } clicked first!");
                    break;
                default :
                    await turnContext.sendActivity(`This is a simple Welcome Bot sample. You can say 'intro' to see the introduction card. If you are running this bot in the Bot Framework Emulator, press the 'Start Over' button to simulate user joining a bot or a channel`);
                }
            }
            // Save state changes
            await this.userState.saveChanges(turnContext);
            await this.conversationState.saveChanges(turnContext);

        } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
            // Send greeting when users are added to the conversation.
            await this.sendWelcomeMessage(turnContext);
        } else {
            // Generic message for all other activities
            await turnContext.sendActivity(`[${ turnContext.activity.type } event detected]`);
        }
    }

    /**
     * Sends welcome messages to conversation members when they join the conversation.
     * Messages are only sent to conversation members who aren't the bot.
     * @param {TurnContext} turnContext
     */
    async sendWelcomeMessage(turnContext) {
        // Do we have any new members added to the conversation?
        await this.getMemberData(turnContext);

        if (turnContext.activity.membersAdded.length !== 0) {
            // Iterate over all new members added to the conversation
            for (let idx in turnContext.activity.membersAdded) {
                // Greet anyone that was not the target (recipient) of this message.
                // Since the bot is the recipient for events from the channel,
                // context.activity.membersAdded === context.activity.recipient.Id indicates the
                // bot was added to the conversation, and the opposite indicates this is a user.
                if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                    await turnContext.sendActivity(`Welcome to TMS Bot!`);
                    await turnContext.sendActivity(`In this example, the bot handles 'hello', 'hi', 'help' and 'intro. ` +
                                            `Try it now, type 'hi'`);
                }
            }
        }
    }

    // async getMembers(turnContext) {
    //     var members = await adapter.getConversationMembers(turnContext);
    //     // var conversations  = await adapter.getConversations(turnContext);
    //     return members;
    // }
   
    // async receivedData(data) {
    //     console.log("Data is" + JSON.stringify(data));
    //     temp = true;
    //     await this.onTurn(this.conversationState.context, data);
    //     console.log(`going to onTurn`);
    // }


    async getMemberData(turnContext){
        
        if(!turnContext.activity.conversation.isGroup){
            console.log("personal");
        }
        else{        
        
        var conversationId = turnContext.activity.channelData.team.id;
        var serviceUrl = turnContext.activity.serviceUrl;
        var clientId = turnContext.adapter.settings.appId;
        var clientSecret = turnContext.adapter.settings.appPassword; 

        var options = { 
            method: 'POST',
            url: 'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
            headers: 
            { 
                'cache-control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded' 
            },
            form: 
            { 
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
                scope: 'https://api.botframework.com/.default' 
            } 
        };

        request(options, (err, response, body) => {
            if(!err){
                access_token = JSON.parse(body).access_token;
            }
            else {
                console.log(err);
            }
        });

        var data = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${access_token}`
            },
            url: `${serviceUrl}v3/conversations/${conversationId}/members`,
            method: 'GET'
        };
            
        request(data, (err, response, body) =>{
            if(!err){
                membersList = JSON.parse(body);
            }
            else {
                console.log(err);
            }
        });
    }
}

}

module.exports.WelcomeBot = WelcomeBot;
