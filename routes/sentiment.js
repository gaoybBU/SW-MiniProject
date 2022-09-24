var express = require('express');
const needle = require('needle');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const qs = require('querystring')

var router = express.Router();

async function getSentiment(tweets) {
    // tweets is an Array() of strings, each string is a user's tweet
    // For now, use the following as a test array:
    let tweetsArray = Array();
    let sentiment = 0;
    tweetsArray.push(["Hello", "I studied NZ fur seals for years and the babies will lie on the rocks with just their face in the water blowing bubbles all day <3", "Good Lord, that is wonderful."])

    return sentiment
}

router.get('/', (req, res, next) => {

    res.send("Bot detecting!");
})

module.exports = router;