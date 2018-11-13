// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// Import required packages
const path = require('path');
const restify = require('restify');
const bodyParser = require('body-parser');
// Import required bot services. See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, UserState, MemoryStorage, ConversationState } = require('botbuilder');
// Import required bot configuration.
const { BotConfiguration } = require('botframework-config');

const { WelcomeBot } = require('./bot');

// import * as builder from "botbuilder";

// Read botFilePath and botFileSecret from .env file
// Note: Ensure you have a .env file and include botFilePath and botFileSecret.
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

// Define a state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.
// let userState;
// let conversationState;

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
var memoryStorage = new MemoryStorage();
var memoryStorage1 = new MemoryStorage();
// let userState = new UserState(memoryStorage);
// const conversationState = new ConversationState(memoryStorage1);

var requestData;

let activity_id;
let channel_id;
let authorizationToken;

// adapter.use(conversationState);

// // CAUTION: You must ensure your product environment has the NODE_ENV set
//         //  to use the Azure Blob storage or Azure Cosmos DB providers.
// const { BlobStorage } = require('botbuilder-azure');
// // Storage configuration name or ID from .bot file
// const STORAGE_CONFIGURATION_ID = '<STORAGE-NAME-OR-ID-FROM-BOT-FILE>';
// // Default container name
// const DEFAULT_BOT_CONTAINER = '<DEFAULT-CONTAINER>';
// // Get service configuration
// const blobStorageConfig = botConfig.findServiceByNameOrId(STORAGE_CONFIGURATION_ID);
// const blobStorage = new BlobStorage({
//     containerName: (blobStorageConfig.container || DEFAULT_BOT_CONTAINER),
//     storageAccountOrConnectionString: blobStorageConfig.connectionString,
// });
// userState = new userState(blobStorage);


// CAUTION: You must ensure your product environment has the NODE_ENV set
        //  to use the Azure Blob storage or Azure Cosmos DB providers.
const { BlobStorage } = require('botbuilder-azure');
// Storage configuration name or ID from .bot file
// const STORAGE_CONFIGURATION_ID = '<STORAGE-NAME-OR-ID-FROM-BOT-FILE>';
// Default container name
// const DEFAULT_BOT_CONTAINER = '<DEFAULT-CONTAINER>';
// Get service configuration
// const blobStorageConfig = botConfig.findServiceByNameOrId(STORAGE_CONFIGURATION_ID);
const blobStorage = new BlobStorage({
    containerName: 'mytmsbotblob',
    storageAccountOrConnectionString: `DefaultEndpointsProtocol=https;AccountName=mytmsbotblob;AccountKey=3xHm5r3+RDlI5vBmUwdkkcNdyG8lfDGjcJ24QGPDt/tgMiXAYoNitQvzTXG5O/RWPkZPV6mBjj8p0AUuZXO0Qw==;EndpointSuffix=core.windows.net`,
});
// userState = new userState(blobStorage);
conversationState = new ConversationState(blobStorage);
userState = new UserState(blobStorage);
// Create the main dialog.
const bot = new WelcomeBot(conversationState, userState);

// Create HTTP server
let server = restify.createServer();
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open welcome-users.bot file in the Emulator`);
});
var count = 0;
// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', (req, res) => {
    console.log("came here");
    
    adapter.processActivity(req, res, async (context) => {
        console.log(context);
        // route to main dialog.
        count++;
        requestData = req.body;
        
        if(count===1) {
            activity_id = context.activity.id;
        }
        channel_id = context.activity.channelData.teamsChannelId;
        authorizationToken = req.headers.authorization;
        
        await bot.onTurn(context, null);
    });
});

server.post('/api', (req, res) => {
    console.log("Salesforce Data");
    var data = req.body;
    console.log(data);
    
    req.headers.authorization = authorizationToken;
    req.body = requestData;

    let state = data.state;

    switch(state){
        case 'CT': 
            channel_id = '19:143bfa51ccd4417bad065466f59057b1@thread.skype';
            break;
        case 'NY': 
            channel_id = '19:f09d68df39be4ca68018faf6f21bf360@thread.skype';
            break;
        case 'RI':
            channel_id = '19:4edacd5443634d74b93e8583f9583e7f@thread.skype';
            break;
    }
    console.log(activity_id);
    req.body.channelData.teamsTeamId = channel_id;
    req.body.channelData.teamsChannelId = channel_id;
    req.body.id = activity_id;
    req.body.conversation.id = channel_id+';messageid='+activity_id+1;
    // console.log(activity_id);
    // console.log(req.body);
        adapter.processActivity(req, res, async (context) => {
        // route to main dialog.
        // await logConversationState(context);
        activity_id = context.activity.id;
        console.log("id is "+activity_id);
        console.log(context);
        await bot.onTurn(context, data);
    });
    // activity_id = activity_id + 1;
});

async function getConversationState(){
    return conversationState['context'];
}

async function logConversationState(context){
    try {
        conversationState['context'] = context;
        console.log('Successful write');
        // console.log("conversationState "+ JSON.stringify(conversationState));
        conversationState.saveChanges(context);
    }
    catch(err) {
        console.log("Error in storing");
    }

}