var express = require('express');
const needle = require('needle');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const qs = require('querystring');
const language = require('@google-cloud/language');

var router = express.Router();
const bearerToken = process.env.TWITTER_BEARER_TOKEN;
const getIdURL = "https://api.twitter.com/2/users/by"

async function getUserID(username) {
    let params = {
        "usernames" : username
    }

    const options = {
        headers: {
            "User-Agent": "v2QuoteTweetsJS",
            "authorization": `Bearer ${bearerToken}`
        }
    }

    const resp = await needle('get', getIdURL, params, options);
    return resp.body["data"][0]["id"].toString();

};

async function getUserComment(uid) {
    // Given user's id, get the user's 100 most recent tweets

    let userComments = Array();
    const getTweetsURL = `https://api.twitter.com/2/users/${uid}/tweets`

    let params = {
        "tweet.fields" : "conversation_id,created_at",
        "max_results" : 100
    }

    const options = {
        headers: {
            "User-Agent": "v2QuoteTweetsJS",
            "authorization": `Bearer ${bearerToken}`
        }
    }

    let resp = await needle('get', getTweetsURL, params, options);
    
    for (const comment of resp.body["data"]) {
        // Push in comment object, id and all
        userComments.push(comment["text"]);
    }

    console.log(userComments[0])
    return userComments;

}

async function getSentiment(tweets) {

    // Instantiates a client
    const client = new language.LanguageServiceClient();

    const text = tweets.join("\n\n");

    const document = {
        content: text,
        type: 'PLAIN_TEXT',
    };
    // Detects the sentiment of the text
    const [result] = await client.analyzeSentiment({document: document});
    let sentiment = result.documentSentiment;
    console.log(sentiment)

    return sentiment;
}

router.get('/', async (req, res, next) => {
    let username = req.query.follower;
    let uid = await getUserID(username);
    let tweets = await getUserComment(uid);
    let sentiment = await getSentiment(tweets)
    res.send("Bot detecting! Sentiment score is " + sentiment.score);
})

module.exports = router;

