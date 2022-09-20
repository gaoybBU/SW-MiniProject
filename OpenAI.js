const url = 'https://api.openai.com/v1/completions';
var needle = require('needle');


const { request } = require("needle");
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const response = await openai.createCompletion({
  model: "text-davinci-002",
  prompt: "Say this is a test",
  max_tokens: 6,
  temperature: 0,
});

needle
  .post(url, response)
