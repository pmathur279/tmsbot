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
let userState = new UserState(memoryStorage);
const conversationState = new ConversationState(memoryStorage1);

var activity_id;
var channel_id;
var authorizationToken;

// adapter.use(conversationState);

// CAUTION: You must ensure your product environment has the NODE_ENV set
//          to use the Azure Blob storage or Azure Cosmos DB providers.
// const { BlobStorage } = require('botbuilder-azure');
// Storage configuration name or ID from .bot file
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

// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', (req, res) => {
    console.log("came here");
    console.log(req);
    
    adapter.processActivity(req, res, async (context) => {
        // route to main dialog.

        channel_id = context.activity.channelData.teamsChannelId;
        activity_id = context.activity.id;
        authorizationToken = req.headers.authorization;

        await logConversationState(context);

        console.log(context);
        await bot.onTurn(context, null);
    });
});

server.post('/api', (req, res) => {
    console.log("Salesforce Data");
    var data = req.body;
    // var context = conversationState['context']
    // bot.onTurn(context, req.body);
    // res.send(200);
    req.headers.authorization = authorizationToken;

    req.body = { 
        data : data,
        text: '',
        textFormat: 'plain',
        attachments: [ [Object] ],
        type: 'message',
        timestamp: '2018-11-09T16:52:54.434Z',
        localTimestamp: '2018-11-09T11:52:54.434-05:00',
        id: activity_id+1,
        channelId: 'msteams',
        serviceUrl: 'https://smba.trafficmanager.net/amer/',
        from:
        { id: '29:17VcvG_NmR6IH4HH7bTQ9fM_12nmmfHiVaz9Nj98OeJBshii7LYT-3ildmNJcd_QoW-OAn5_KpEvB33yjuV7uAQ',
        name: 'Pratik Mathur',
        aadObjectId: 'a687d323-8d8d-4e36-87ad-bae4fc030e4b' },
        conversation:
        { isGroup: true,
        conversationType: 'channel',
        id: channel_id+';messageid='+activity_id+1 },
        recipient:
        { id: '28:b6de1dce-ab70-4a06-81ed-e20758574f25',
        name: 'mytmsbot' },
        entities: [ [Object], [Object] ],
        channelData:
        { teamsChannelId: channel_id,
        teamsTeamId: channel_id,
        channel: [Object],
        team: [Object],
        tenant: [Object] } }

        console.log(req);
        adapter.processActivity(req, res, async (context) => {
        // route to main dialog.
        // await logConversationState(context);

        console.log(context);
        await bot.onTurn(context, data);
    });
});

async function getConversationState(){
    return conversationState['context'];
}

async function logConversationState(context){
    try {
        conversationState['context'] = context;
        console.log('Successful write');
        console.log("conversationState "+ JSON.stringify(conversationState));
        conversationState.saveChanges(context);
    }
    catch(err) {
        console.log("Error in storing");
    }

}