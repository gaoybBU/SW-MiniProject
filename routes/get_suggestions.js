var express = require('express');
const needle = require('needle');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const qs = require('querystring');
const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs');
const { url } = require('inspector');

var router = express.Router();

const consumer_key = process.env.TWITTER_API_KEY;
const consumer_secret = process.env.TWITTER_API_SECRET;
const bearerToken = process.env.TWITTER_BEARER_TOKEN;
const openai_key = process.env.OPENAI_API_KEY;

// Setting up OpenAI
const configuration = new Configuration({
  apiKey: openai_key,
});
const openai = new OpenAIApi(configuration);

const getIdURL = "https://api.twitter.com/2/users/by"

async function OpenAI_getCompletion(comment) {
    let prompt = "You: " + comment['comment'] + "\n" + "Friend: " + comment['text'] + "\n" + "You: ";

    const response = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: prompt,
        temperature: 0.5,
        max_tokens: 60,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0,
        stop: ["You:"],
    });

    console.log(prompt)
    console.log(response.data['choices'][0]['text']);
    return response.data['choices'][0]['text'];
}

function reply_sort(a,b) {
    if (a["public_metrics"]["like_count"] < b["public_metrics"]["like_count"]) {
        return -1
    } else if (a["public_metrics"]["like_count"] > b["public_metrics"]["like_count"]) {
        return 1;
    } else {
        return 0;
    }
}

async function getReplies(comments) {
    let userReplies = Array();

    // Now get the god damn replies to those comments
    const queryURL = "https://api.twitter.com/2/tweets/search/recent"
    for (const comment of comments) {
        let params = {
            "max_results" : "100",
            "sort_order" : "relevancy",
            "tweet.fields" : "public_metrics",
            "query" : `in_reply_to_tweet_id:${comment['id']}`
        }
    
        const options = {
            headers: {
                "User-Agent": "v2QuoteTweetsJS",
                "authorization": `Bearer ${bearerToken}`
            }
        }

        const resp = await needle('get', queryURL, params, options);
        if (resp.body["data"]) {
            for (const replies of resp.body["data"]) {
                // Associate reply with the comment it replied to
                let replies_and_comment = replies;
                replies_and_comment['comment'] = comment['text']
                userReplies.push(replies);
            }
        }
    }

    console.log("Number of replies: " + userReplies.length)
    return userReplies;
}

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

async function getTopComment(uid, top_c, t_since) {
    // Given the user's id, the oldest time of their comment, and how many replies we want to get, return the top N replies

    let userComments = Array();
    let userReplies = Array();

    const getTweetsURL = `https://api.twitter.com/2/users/${uid}/tweets`

    let params = {
        "exclude" : "replies",
        "tweet.fields" : "conversation_id,created_at",
        "start_time" : t_since,
        "max_results" : 10
    }
    const options = {
        headers: {
            "User-Agent": "v2QuoteTweetsJS",
            "authorization": `Bearer ${bearerToken}`
        }
    }

    // First, get the user's tweets until the oldest given time
    let resp = await needle('get', getTweetsURL, params, options);
    
    // TODO: Check if the number of comments is greater than 0. Edge case

    for (const comment of resp.body["data"]) {
        // Push in comment object, id and all
        userComments.push(comment);
    }
    
    maxComments = 20;

    // Paginate through the user's tweets
    while (resp.body["meta"]["next_token"]) {
        let params = {
            "pagination_token" : resp.body["meta"]["next_token"],
            "exclude" : "replies",
            "tweet.fields" : "conversation_id,created_at",
            "start_time" : t_since,
            "max_results" : 10
        }
        resp = await needle('get', getTweetsURL, params, options);
        if (resp.body["data"]) {
            for (const comment of resp.body["data"]) {
                if (userComments.length < maxComments) {
                    userComments.push(comment);
                } else break
            }
        }

        if (userComments.length > maxComments) break;
    }

    console.log("Number of user comments: " + userComments.length)
    console.log("Example user tweet: " + userComments[0])

    // Get the array of replies to those tweets (more specific detail in function)
    userReplies = await getReplies(userComments);
    
    // Sort from leat liked to most liked, then get top k replies
    userReplies.sort(reply_sort)
    console.log("Number of replies: " + userReplies[userReplies.length - 1])

    let topReplies = Array();
    for (var i = 0; i < top_c; i++) {
        topReplies.push(userReplies[userReplies.length - 1 - i]);
    }

    console.log("Length of topReplies:" + topReplies.length)

    return topReplies;
};

async function getSuggestions(comments) {

    let completions = Array()
    for (var i = 0; i < comments.length; i++) {
        let completion = await OpenAI_getCompletion(comments[i]);
        completions.push(completion);
    }
    return completions;
};

function getCommentURL(comments_arr) {
    let url_arr = Array();
    for (const comment_obj of comments_arr) {
        let id = comment_obj['id'];
        let url = `https://twitter.com/BOI/status/${id}`;
        url_arr.push(url);
    }

    return url_arr
}

router.get('/', async (req, res, next) => {
    let username = req.query.username;
    let top_c = req.query.top_followers;
    let hours_since = 500;
    let t_since = new Date((new Date().getTime() / 1000 - (hours_since * 3600)) * 1000).toISOString();

    let uid = await getUserID(username);
    let top_comments = await getTopComment(uid, top_c, t_since);
    let comments_url = getCommentURL(top_comments);
    let suggestions = await getSuggestions(top_comments);
    let tweet_threads = Array();

    for (i = 0; i < suggestions.length; i++) {
        let thread = {};
        thread["tweet"] = top_comments[i]['comment'];
        thread["reply"] = top_comments[i]['text'];
        thread["suggestion"] = suggestions[i];
        thread["url"] = comments_url[i];
        tweet_threads.push(thread);
    }

    res.render('suggestions', {tweet_threads : tweet_threads});
})



module.exports = router;