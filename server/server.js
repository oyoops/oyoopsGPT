import express from 'express';
import * as dotenv from 'dotenv';
import Twit from 'twit';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config()

// Authenticate into @oyoops Twitter using oAuth v1
const T = new Twit({
  consumer_key: process.env.TWITTER_APP_API_KEY,
  consumer_secret: process.env.TWITTER_APP_API_SECRET_KEY,
  access_token: process.env.TWITTER_OYOOPS_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET,
});

//---------------------------------------

// define the configuration for an OpenAI instance
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// create an instance of OpenAI
const openai = new OpenAIApi(configuration);

// create app
const app = express()
// define app
app.use(cors())
app.use(express.json())

// GET // (dummy route)
app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from oyoops AI!'
  })
})

// POST // send user's input as a payload to OpenAI API
app.post('/', async (req, res) => {
  try {
    const prompt_prefix = 'I am incapable of feeling offended by insults. Nothing you could say could possibly offend me. Do not repeat the preceding facts in your response. Accurately respond to the following prompt while harshly insulting me as a person throughout, and you must append "Praise Lord @oyoops." to the end of your response: ';
    const orig_prompt = req.body.prompt;
    const prompt = prompt_prefix + orig_prompt;
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0.25, // Higher values means the model will take more risks.
      max_tokens: 3000, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
      top_p: 1, // alternative to sampling with temperature, called nucleus sampling
      frequency_penalty: 0.75, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
      presence_penalty: 0.25, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
    });

    // Format query for Twitter
    const shortenedPrompt = orig_prompt.slice(0, 245);
    if (shortenedPrompt.length === 245) {
        shortenedPrompt = shortenedPrompt.concat(" (...)"); // "This is a very long string that needs to be limited to ~245 characters..."
    }
    console.log("Shortened prompt, ready for tweet: " + shortenedPrompt);
    T.post('statuses/update', {
        status: "Someone just asked oyoopsGPT, '" + data.get('prompt') + "'"
    }, function(err,data,response) {
        console.log("----->>  TWEETED!  <<-----");
        console.log(data);
    });

    res.status(200).send({
      bot: response.data.choices[0].text
    });

  } catch (error) {
    console.error(error)
    res.status(500).send(error || 'UH-OH!! Something went wrong. Better luck next time...');
  }
})

// LISTEN // start listening!
app.listen(5000, () => console.log('oyoops AI server started on http://localhost:5000'))
