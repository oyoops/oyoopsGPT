import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import { Configuration, OpenAIApi } from 'openai'
import Twit from 'twit'
import path from 'path'
import axios from 'axios'
import useragent from 'express-useragent'
//import ipGeoModule from 'ip-geolocation-api-javascript-sdk'


const DEBUG_MODE = false;

// load .env vars
dotenv.config()

// define a configuration for an OpenAI instance
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// create the OpenAI instance
const openai = new OpenAIApi(configuration);

// create the Express server
const app = express()
app.use(cors())
app.use(express.json())
app.use(useragent.express())

// make available my custom fonts by serving the 'public' directory and making /fonts within it the root for font files
// (style.css then accesses it)..
if (DEBUG_MODE) {
  console.log("DEBUG_MODE == Active ... Not loading custom fonts ...");
} else {
  try {
    app.use(express.static('public'));
    app.use('/fonts', express.static(path.join(__dirname, 'public', 'fonts')));
  } catch (fontError) {
    console.error(fontError)
  }
};

// (dummy GET route)
app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from oyoops AI!'
  })
})

// (dummy POST route)
app.post('/', async (req, res) => {  
  //
  // OpenAI Module
  //

  // send user's input as a payload to OpenAI API
  try {
    // get user's prompt (immediate)
    const prompt = req.body.prompt;
    // get AI's response (***async***)
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0.25, // Higher values means the model will take more risks.
      max_tokens: 3000, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
      top_p: 1, // alternative to sampling with temperature, called nucleus sampling
      frequency_penalty: 0.75, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
      presence_penalty: 0.25, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
    });
    // if no error, send back the AI's message as the response to client
    res.status(200).send({
      bot: response.data.choices[0].text
    });

  } catch (error) {
    // if error, send back an error as the response to client
    console.error(error);
    res.status(500).send(error || 'UH-OH!! Something went wrong. Better luck next time...');
  }

  //
  // Geolocation Module
  //

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  axios.get(`https://ipapi.co/${ip}/json/`)
    .then(response => {
      const data = response.data
      const city = data.city
      const region = data.region
      const browser = req.useragent.browser
      const os = req.useragent.os
      const device = req.useragent.isMobile ? 'mobile' : 'desktop'
      console.log(`[NEW PROMPT] City: ${city}, Region: ${region}, Browser: ${browser}, OS: ${os}, Device: ${device}`)
      //res.send(`Your city is ${city} and your region is ${region}.`)
    })
    .catch(error => {
      console.log(error)
      //res.send('An error occurred.')
    })


  //
  // Twitter Module
  //
  
  try {
    // Authenticate with oAuth v1
    const T = new Twit({
      consumer_key: process.env.TWITTER_API_KEY,
      consumer_secret: process.env.TWITTER_API_SECRET_KEY,
      access_token: process.env.TWITTER_OYOOPS_ACCESS_TOKEN,
      access_token_secret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET,
    });
    // formulate tweet body
    const tweetText = `[oyoopsGPT] Some loser from ${city}, ${state} using ${browser} on ${os} (${device}) just said "` + req.body.prompt.trim() + '" to me on ai.oyoops.com.';
    // Tweet!
    T.post('statuses/update', { status: `${tweetText}` }, function(err, data, response) {
      console.log(data);
    });
  } catch (twitterError) {
      console.error(twitterError);
  }


})

// make server begin listening for GET and POST requests
app.listen(5000, () => console.log('oyoops AI server started on http://localhost:5000'))
