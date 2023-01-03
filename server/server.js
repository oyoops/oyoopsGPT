import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import { Configuration, OpenAIApi } from 'openai'
import Twit from 'twit'
import path from 'path'
import axios from 'axios'
import useragent from 'express-useragent'

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

// make available my custom fonts by serving the 'public' directory and making /fonts within it the root for font files. style.css then accesses it.
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


// ---------------------

// function ez
const processSomething = callback => {
  setTimeout(callback, 20000);
}

// ---------------------


// (dummy GET route)
app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from oyoops AI!'
  })
})

// health
app.get('/health', async (req, res) => {
  res.status(200).send({
    message: 'Healthy :-D'
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
  // Twitter Module
  //

  // get client IP
  const ips =  req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ip = ips.substring(0, ips.indexOf(",")).trim();
  console.log("IP Address: " + ip);

  //
  let city = '';
  let state = '';
  let browser = '';
  let os = '';
  let device = '';

  axios.get(`https://ipapi.co/${ip}/json/`) // geolocate client using IP (from header) & ipapi free API
    .then(response => {
      const data = response.data;
      city = data.city;
      state = data.region;
      // get client properties from useragent
      browser = req.useragent.browser;
      os = req.useragent.os;
      device = req.useragent.isMobile ? 'mobile' : 'desktop';

      console.log(`[NEW PROMPT] City: ${city}, State: ${state}, Browser: ${browser}, OS: ${os}, Device: ${device}`);
      
      // Connect to Twitter and tweet the current prompt.
      try {
        // Authenticate with oAuth v1
        const T = new Twit({
          consumer_key: process.env.TWITTER_API_KEY,
          consumer_secret: process.env.TWITTER_API_SECRET_KEY,
          access_token: process.env.TWITTER_OYOOPS_ACCESS_TOKEN,
          access_token_secret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET,
        });
        // Note: If Twitter API fails to authenticate, the rest of this block will not run.

        // formulate tweet body depending on conditions
        if (state == "Massachusetts") {
          const tweetText = `[oyoopsGPT] Some Celtics-loving trashbag from ${state} just said "` + req.body.prompt.trim() + '" to me on ai.oyoops.com #bot';
          // Tweet!
          T.post('statuses/update', { status: `${tweetText}` }, function(err, data, response) {
            console.log("Tweeted: '" + data.text) + "'";
          });
        } else if (os == "OS X" && browser == "Safari") {
          const tweetText = `[oyoopsGPT] Somebody from ${city} on an iPhone just said "` + req.body.prompt.trim() + '" to me on ai.oyoops.com #bot';
          // Tweet!
          T.post('statuses/update', { status: `${tweetText}` }, function(err, data, response) {
            console.log("Tweeted: '" + data.text) + "'";
          });
        } else if (state == "Florida") {
          const tweetText = `[oyoopsGPT] Some Floridian in ${city} using ${browser} on ${os} ${device} just said "` + req.body.prompt.trim() + '" to me on ai.oyoops.com #bot';
          // Tweet!
          T.post('statuses/update', { status: `${tweetText}` }, function(err, data, response) {
            console.log("Tweeted: '" + data.text) + "'";
          });
        } else {
          const tweetText = `[oyoopsGPT] Somebody in ${city}, ${state} using ${browser} on ${os} ${device} just said "` + req.body.prompt.trim() + '" to me on ai.oyoops.com #bot';
          // Tweet!
          T.post('statuses/update', { status: `${tweetText}` }, function(err, data, response) {
            console.log("Tweeted: '" + data.text) + "'";
          });
        }
        // Tweet!
        //const tweetText = `[oyoopsGPT] Somebody from ${city}, ${state} using ${browser} on ${os} ${device} just said "` + req.body.prompt.trim() + '" to me on ai.oyoops.com #bot';
        //T.post('statuses/update', { status: `${tweetText}` }, function(err, data, response) {
        //  console.log(data);
        //});

      } catch (twitterError) {
          console.error(twitterError);
      }

    })
    .catch(geolocationOrUseragentError => {
      console.log(geolocationOrUseragentError);
    });

    // set up a stream
    //try {
    //  // Authenticate with oAuth v1
    //  const T = new Twit({
    //    consumer_key: process.env.TWITTER_API_KEY,
    //    consumer_secret: process.env.TWITTER_API_SECRET_KEY,
    //    access_token: process.env.TWITTER_OYOOPS_ACCESS_TOKEN,
    //    access_token_secret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET,
    //  });

    //  const twitterUsername = "oyoops";
    //  var stream = T.stream('statuses/filter', { track: twitterUsername });
    //  stream.on('tweet', pressStart);
    //} catch (streamError) {
    //  console.error(streamError);
    //}

});

// start Express server & begin listening for GET and POST requests
app.listen(5000, () => console.log('oyoops AI server started on http://localhost:5000'))




/* function pressStart(tweet) {

  var id = tweet.id_str;
  var text = tweet.text;
  var name = tweet.user.screen_name;

  let regex = /(please)/gi;


  let playerOne = text.match(regex) || [];
  let playerTwo = playerOne.length > 0;

  //this helps with errors, so you can see if the regex matched and if playerTwo is true or false
  console.log(playerOne);
  console.log(playerTwo);


  // checks text of tweet for mention of SNESSoundtracks
  if (text.includes(twitterUsername) && playerTwo === true) {

    // Start a reply back to the sender
    var replyText = ("@" + name + " Here's your soundtrack: ");

    // Post that tweet
    T.post('statuses/update', { status: replyText, in_reply_to_status_id: id }, gameOver);

  } else {
    console.log("uh-uh-uh, they didn't say the magic word.");
  };

  function gameOver(err, reply) {
    if (err) {
      console.log(err.message);
      console.log("Game Over");
    } else {
      console.log('Tweeted: ' + reply.text);
    }
  };

} */