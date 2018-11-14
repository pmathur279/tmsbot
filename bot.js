// Import required Bot Framework classes.
const { ActivityTypes } = require('botbuilder');
const { CardFactory } = require('botbuilder');

// Import required bot services. See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { UserState, ConversationState } = require('botbuilder');
// Import required bot configuration.

var request = require('request');

// Create bot adapter.
// See https://aka.ms/about-bot-adapter to learn more about bot adapter.
// const adapter = new BotFrameworkAdapter({
//     appId: endpointConfig.appId || process.env.microsoftAppID,
//     appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
// });

let membersList;
let access_token;
// Adaptive Card content
const IntroCard = require('./resources/IntroCard.json');

// Welcomed User property name
const WELCOMED_USER = 'welcomedUserProperty';
const BUTTON_CLICKED = 'buttonClickedProperty';
const ACTIVITY_ID = 'activityIdProperty';
const CONTEXT_STATE = 'contextStateProperty';

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
        this.activityIdProperty = conversationState.createProperty(ACTIVITY_ID);
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
                
        if(data !== null) {
            console.log(`received data `+ JSON.stringify(data));
            turnContext.activity.text = '<at>mytmsbot</at> salesforce';
        }
        
        this.getMemberData(turnContext);

        if(turnContext.activity.type === ActivityTypes.Invoke){
            
            const wasButtonClicked = await this.buttonClickedProperty.get(turnContext, false);
            
            if(!wasButtonClicked){
                for(var i=0; i< membersList.length; i++){
                    if(membersList[i].id === turnContext.activity.from.id){
                        await turnContext.sendActivity(`${ turnContext.activity.from.name }  with email address ${membersList[i].email } clicked the button!`); 
                    }
                }
                await this.buttonClickedProperty.set(turnContext, true);
                await this.activityIdProperty.set(turnContext, turnContext.activity.id); 
   
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

            console.log(this.userState);
            // Your bot should proactively send a welcome message to a personal chat the first time
            // (and only the first time) a user initiates a personal chat with your bot.
            if (didBotWelcomedUser === false) {
                // The channel should send the user name in the 'From' object
                await this.getMemberData(turnContext);
                await turnContext.sendActivity(`Welcome to TMS Bot ${turnContext.activity.from.name}!`);

                // Set the flag indicating the bot handled the user's first message.
                await this.welcomedUserProperty.set(turnContext, true);
            } else {
                // This example uses an exact match on user's input utterance.
                // Consider using LUIS or QnA for Natural Language Processing.
                var text = turnContext.activity.text.toLowerCase();
                console.log(text);
                if(turnContext.activity.conversation['conversationType'] === 'personal'){
                    console.log('personal');
                }
                else{
                    var msg = text;
                    text = msg.slice(18, msg.length);
                    text=text.trim();
                    console.log(text);
                }
                switch (text) {
                case 'hello':
                case 'hi':
                    await turnContext.sendActivity("You said "+text);
                    break;
                case 'leads':
                    const wasButtonClicked = await this.buttonClickedProperty.get(turnContext, false);
                    if(!wasButtonClicked){
                        for(var i=0; i< membersList.length; i++){
                            console.log("inside the loop");
                            if(membersList[i].id === turnContext.activity.from.id){
                                await turnContext.sendActivity(`${ turnContext.activity.from.name }  with email address ${membersList[i].email } clicked the button!`); 
                            }
                        }
                        await this.buttonClickedProperty.set(turnContext, true);
                        // await this.activityIdProperty.set(turnContext, turnContext.activity.id);     
                    }
                    else {
                        await turnContext.sendActivity(`Button already clicked!`);
                    }
                    
                    // await turnContext.sendActivity(`${ turnContext.activity.from.name } clicked the button!`);   
                    await this.conversationState.saveChanges(turnContext); 
                    console.log(this.conversationState);
                    break;

                case 'salesforce':
                    var sfdata = data;
                    // await turnContext.sendActivity(`Salesforce data received!`);
                    // await turnContext.sendActivity(`Data is ${sfdata}`)
                    await turnContext.sendActivity({
                        attachments: [{
                            contentType: "application/vnd.microsoft.card.adaptive",
                            content: {
                                $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
                                type: "AdaptiveCard",
                                version: "1.0",
                                body: [
                                    {
                                        "type": "TextBlock",
                                        "spacing": "medium",
                                        "size": "large",
                                        "weight": "bolder",
                                        "text": "Salesforce Lead Data",
                                        "wrap": true,
                                        "maxLines": 0
                                    },
                                    {
                                    "type": "Image",
                                    "url": "https://www.totalmortgage.com/images/logos/tmslogo.png",
                                    "size": "stretch"
                                  },
                                  {
                                    "type": "TextBlock",
                                    "size": "medium",
                                    // "isSubtle": true,
                                    // "weight": "bolder",
                                    "text": "**New Lead has arrived:**",
                                    "wrap": true,
                                    "maxLines": 0
                                  },
                                  {
                                    "type": "ColumnSet",
                                    "columns": [
                                        {
                                        "type": "Column",
                                        "items": [{
                                                "type": "TextBlock",
                                                "spacing": "medium",
                                                "size": "default",
                                                // "weight": "bolder",
                                                "text": "**First Name** : "+sfdata['FirstName'],
                                                "wrap": true,
                                                "maxLines": 0,
                                                "seperator" : true
                                            },
                                            {
                                                "type": "TextBlock",
                                                "spacing": "medium",
                                                "size": "default",
                                                // "weight": "bolder",
                                                "text": "**Last Name** : "+sfdata['LastName'],
                                                "wrap": true,
                                                "maxLines": 0
                                            }  
                                        ]
                                    },
                                    {
                                        "type": "Column",
                                        "items": [{
                                            "type": "TextBlock",
                                            "spacing": "medium",
                                            "size": "default",
                                            // "weight": "bolder",
                                            "text": "**Status** : "+sfdata['Status'],
                                            "wrap": true,
                                            "maxLines": 0
                                          },
                                          {
                                            "type": "TextBlock",
                                            "spacing": "high",
                                            "size": "default",
                                            // "weight": "bolder",
                                            "text": "**Loan Type** : "+sfdata['Loan_Type'],
                                            "wrap": true,
                                            "maxLines": 0
                                          }  
                                        ]
                                    }   
                                ]
                                },
                                  {
                                    "type": "TextBlock",
                                    "spacing": "medium",
                                    "size": "default",
                                    // "weight": "bolder",
                                    "text": "**Property State** : "+sfdata['Property_State'],
                                    "wrap": true,
                                    "maxLines": 0
                                  }
                                  
                                ],
                                "actions": [
                                  {
                                    "type": "Action.Submit",
                                    "title": "Claim Lead",
                                    "spacing": "medium",
                                    "data": {
                                        "msteams": {
                                          "type": "messageBack",
                                          "displayText": "",
                                          "text": "<at>mytmsbot</at> leads",
                                          "value": "{\"invokeResponse\": \"Good\"}"
                                      }
                                    }
                                  },
                                  {
                                    "type": "Action.Submit",
                                    "title": "View Lead",
                                    "data": {
                                        "msteams": {
                                          "type": "invoke",
                                          "displayText": "button clicked",
                                          "text": "text to bots",
                                          "value": "www.totalmortgage.com"
                                      }
                                    }
                                  } 
                                ] 
                            }
                            
                          }]
                    });
                    break;
                case 'members': 
                    console.log(JSON.stringify(membersList));
                    break;
                case 'intro':
                case 'help':
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