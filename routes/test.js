var express = require('express');
const needle = require('needle');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const qs = require('querystring');
const language = require('@google-cloud/language');

var router = express.Router();
let totalScore = 0;

async function getSentiment() {
    // tweets is an Array() of strings, each string is a user's tweet
    // For now, use the following as a test array:
    let tweetsArray = Array();
    let sentiment = 0;
    tweetsArray.push(["Fuck you", "I studied NZ fur seals for years and the babies will lie on the rocks with just their face in the water blowing bubbles all day <3", "Good Lord, that is wonderful."])

    tweetsArray.forEach(analyizer);
    output = totalScore/tweetsArray.length; // average score
    console.log(output);
    return output;   
}

async function analyizer(text) {
    // analyises the sentiment for a string of text
    const client = new language.LanguageServiceClient();
    const document = {
        content: text,
        type: 'PLAIN_TEXT',

    };

    const [result] = await client.analyzeSentiment({document: document});
    const sentiment = result.documentSentiment;
    totalScore += sentiment.score;
    console.log(totalScore);
}


console.log(getSentiment().then((res)=>{console.log(res)}));

router.get('/', (req, res, next) => {

    res.send("Bot detecting!");
})

module.exports = router;
