var express = require('express');
const needle = require('needle');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const qs = require('querystring')

var router = express.Router();

const consumer_key = process.env.TWITTER_API_KEY;
const consumer_secret = process.env.TWITTER_API_SECRET;

const requestTokenURL = "https://api.twitter.com/oauth/request_token?" + "oauth_callback=http%3A%2F%2Flocalhost%3A3000%2Ftwitter_login%2Fcallback"
const authenticateURL = "https://api.twitter.com/oauth/authenticate";
const accessTokenURL = 'https://api.twitter.com/oauth/access_token';

const oauth = OAuth({
    consumer: {
        key: consumer_key,
        secret: consumer_secret
    },
    signature_method: 'HMAC-SHA1',
    hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
});

async function requestToken() {

    const authHeader = oauth.toHeader(oauth.authorize({
        url: requestTokenURL,
        method: 'POST'
    }));

    const res = await needle('post', requestTokenURL, null, {
        headers: {
            Authorization: authHeader["Authorization"]
        }
    } )

    if (res.body) {
        return qs.parse(res.body);
    } else {
        throw new Error('Cannot get an OAuth request token');
    }
}

async function authenticateUser(oauth_token) {

    params = {
        "oauth_token" : oauth_token
    }

    const res = await needle('get', requestTokenURL, params);
    console.log(res.body)

    res.send("Done")
}

async function getAcessToken(oauth_token, oauth_verifier) {
    const authHeader = oauth.toHeader(oauth.authorize({
        url: accessTokenURL,
        method: 'POST'
    }));

    let params = {
        "oauth_token": oauth_token,
        "oauth_verifier":oauth_verifier
    }
    const req = await needle('post', accessTokenURL, params, {
        headers: {
            Authorization: authHeader["Authorization"]
        }
    });

    if (req.body) {
        return qs.parse(req.body);
    } else {
        throw new Error('Cannot get an OAuth request token');
    }
}

router.get('/', async(req, res, next) => {

    let data;

    // Make request
    const response = await requestToken();
    res.redirect(authenticateURL + "?oauth_token=" + response.oauth_token);
    // await authenticateUser(response.oauth_token);

})

router.get('/callback', async(req, res, next) => {
    console.log(req.query.oauth_token);

    const response = await getAcessToken(req.query.oauth_token, req.query.oauth_verifier);
    console.log(response)

    // Set cookie for logged in user
    res.cookie('username', response["screen_name"], {expires: 0});
    res.redirect("/");

})

module.exports = router

