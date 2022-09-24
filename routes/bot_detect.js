var express = require('express');
const needle = require('needle');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const qs = require('querystring')

var router = express.Router();

router.get('/', (req, res, next) => {
    res.send("Bot detecting!");
})

module.exports = router;