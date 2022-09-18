var express = require('express');
var router = express.Router();

const needle = require('needle');
const token = process.env.TWITTER_BEARER_TOKEN
const endpointURL = "https://api.twitter.com/2/users/by?usernames="


async function getRequest() {

    // These are the parameters for the API request
    // specify User names to fetch, and any additional fields that are required
    // by default, only the User ID, name and user name are returned
    const params = {
        usernames: "TwitterDev,TwitterAPI", // Edit usernames to look up
        "user.fields": "created_at,description", // Edit optional query parameters here
        "expansions": "pinned_tweet_id"
    }

    // this is the HTTP header that adds bearer token authentication
    const res = await needle('get', endpointURL, params, {
        headers: {
            "User-Agent": "v2UserLookupJS",
            "authorization": `Bearer ${token}`
        }
    })

    if (res.body) {
        return res.body;
    } else {
        throw new Error('Unsuccessful request')
    }
}

/* GET home page. */
router.get('/', async(req, res, next) => {

  let data;

  try {
    // Make request
    const response = await getRequest();
    data = response

  } catch (e) {
    data = 'we have an error'
  }

  console.log(data)
  res.render('index', { title: 'Express' , twit: JSON.stringify(data) });
});

module.exports = router;
