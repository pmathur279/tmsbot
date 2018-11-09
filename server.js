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