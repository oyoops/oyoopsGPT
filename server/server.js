//// Server setup:
import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
//// Twitter:
import Twit from 'twit'
import * as Twitter from 'twitter-api-v2'
import { TwitterApi } from 'twitter-api-v2'
import needle from 'needle' //HTTP client for twitter
import got from 'got' //for oauth2 with user contexts
import * as oauth from 'oauth-1.0a' //for oauth2 with user contexts
//// OpemAI, chatGPT, and DALL-E:
import { Configuration, OpenAIApi } from 'openai'
//import { variations } from 'dalle'
//// Other packages:
import path from 'path'
import axios from 'axios'
import useragent from 'express-useragent'
import multer from 'multer'
import { send } from 'process'

const DEBUG_MODE = false;
dotenv.config()

const userClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY_2,
  appSecret: process.env.TWITTER_API_SECRET_KEY_2,
  //accessToken: TWITTER_OYOOPS_ACCESS_TOKEN_2,
  //accessSecret: TWITTER_OYOOPS_ACCESS_TOKEN_SECRET_2,
});

const TClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY_2,
    appSecret: process.env.TWITTER_API_SECRET_KEY_2,
});

const CALLBACK_URL = "https://ai.oyoops.com/callback";

// Generate auth link
const authLink = await TClient.generateAuthLink(CALLBACK_URL);
const sendURL = authLink.url;
var saveToken = authLink.oauth_token;
var saveTokenSecret = authLink.oauth_token_secret;
// (auth link debug)
console.log("sendURL________=" + sendURL);
console.log("saveToken______=" + saveToken);
console.log("saveTokenSecret=" + saveTokenSecret);

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

// custom fonts
if (DEBUG_MODE) {
  console.log("DEBUG MODE = Active ... Not loading custom fonts!");
} else {
  try {
    app.use(express.static('public'));
    app.use('/fonts', express.static(path.join(__dirname, 'public', 'fonts')));
  } catch (fontError) {
    console.log("Couldn't load the cool font... What are you using, Internet Explorer 5!?")
    console.error(fontError)
  }
};



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
  try {
    var prompt = req.body.prompt;
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0.3, // Higher values = model will take more risks.
      max_tokens: 4000, // Maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
      top_p: 1, // alternative to sampling with temperature, called nucleus sampling
      frequency_penalty: 0.75, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
      presence_penalty: 0.25, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
    });
    var botResponse = response.data.choices[0].text.trim();
<<<<<<< HEAD
    // respond with bot's [raw] response
=======
    console.log("RESPONSE-->" + botResponse);

>>>>>>> parent of 318f20f... GREAT
    res.status(200).send({
      bot: botResponse
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error || 'Uh-oh, something went wrong... Better luck next time!');
  }

  //
  // UserAgent Module
  //
  const ips =  req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ip = ips.substring(0, ips.indexOf(",")).trim();
  console.log("IP Address: " + ip);
  let city = '';
  let state = '';
  let browser = '';
  let os = '';
  let device = '';
  // get client IP
  axios.get(`https://ipapi.co/${ip}/json/`)
    .then(response => {
      const data = response.data;
      city = data.city;
      state = data.region;
      browser = req.useragent.browser;
      os = req.useragent.os;
      device = req.useragent.isMobile ? 'mobile' : 'desktop';
      // log new prompts as received
      console.log(`[ NEW PROMPT ] City: ${city}, State: ${state}, Browser: ${browser}, OS: ${os}, Device: ${device}`);
      console.log(`[  HAS BEEN  ] >> ${prompt}`);
      console.log(`[  RECEIVED  ] @@ ${botResponse}`);

      //
      // Twitter Module
      //
      try {
        // authenticate with Twitter oAuth v1
        const T = new Twit({
          consumer_key: process.env.TWITTER_API_KEY_2,
          consumer_secret: process.env.TWITTER_API_SECRET_KEY_2,
          access_token: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_2,
          access_token_secret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET_2,
        });
        console.log("Auth v1 = Good!(?)")

        var rootTweetId = '1609987781484240897'; // only in case of error

        // Write Tweet:

        // compose tweet depending on location
        if (state == "Massachusetts") {
          const tweetText = `>> Some Celtics-loving trashbag from ${city} (a shithole) said, "` + req.body.prompt.trim() + '" to me on ai.oyoops.com.';
          // Tweet!
          T.post('statuses/update', { status: `${tweetText}` }, function(err, tweetData, response) {
            console.log("Tweeted: '" + tweetData.text) + "'";
            rootTweetId = tweetData.id_str;
            // FOLLOW-UP PROMPT TWEET WITH RESPONSE REPLY TWEET:
            var replyToId = rootTweetId;
            var botReply = botResponse.substring(0,220).trim();
            if (botReply.length === 220) {botReply = botReply.substring(0, 214) + " (...)"}
            var replyTweetText = '@' + tweetData.user.screen_name + ' ' + botReply;
            T.post('statuses/update', { status: `${replyTweetText}`, in_reply_to_status_id: `${replyToId}` }, function(err, data, response) {
              console.log("Replied: '" + data.text) + "'";
              var replyId = data.id_str;
              console.log("Replied to " + tweetData.in_reply_to_status_id);
            });
          });

        } else if (state == "Florida") {
          const tweetText = `>> Someone from ${city}, ${state} said, "` + req.body.prompt.trim() + '" to me on ai.oyoops.com.';
          // Tweet!
          T.post('statuses/update', { status: `${tweetText}` }, function(err, tweetData, response) {
            console.log("Tweeted: '" + tweetData.text) + "'";
            rootTweetId = tweetData.id_str;
            // FOLLOW-UP PROMPT TWEET WITH RESPONSE REPLY TWEET:
            var replyToId = rootTweetId;
            var botReply = botResponse.substring(0,220).trim();
            if (botReply.length === 220) {botReply = botReply.substring(0, 214) + " (...)"}
            var replyTweetText = '@' + tweetData.user.screen_name + ' ' + botReply;
            T.post('statuses/update', { status: `${replyTweetText}`, in_reply_to_status_id: `${replyToId}` }, function(err, data, response) {
              console.log("Replied: '" + data.text) + "'";
              console.log(data);
              var replyId = data.id_str;
              console.log("Replied to " + tweetData.in_reply_to_status_id);
            });
          });

        } else {
          const tweetText = `>> Someone from ${city}, ${state} said, "` + req.body.prompt.trim() + '" to me on ai.oyoops.com.';
          // Tweet!
          T.post('statuses/update', { status: `${tweetText}` }, function(err, tweetData, response) {
            console.log("Tweeted: '" + tweetData.text) + "'";
            rootTweetId = tweetData.id_str;
            // FOLLOW-UP PROMPT TWEET WITH RESPONSE REPLY TWEET:
            var replyToId = rootTweetId;
            var botReply = botResponse.substring(0,220).trim();
            if (botReply.length === 220) {botReply = botReply.substring(0, 214) + " (...)"}
            var replyTweetText = '@' + tweetData.user.screen_name + ' ' + botReply;
            T.post('statuses/update', { status: `${replyTweetText}`, in_reply_to_status_id: `${replyToId}` }, function(err, data, response) {
              console.log("Replied: '" + data.text) + "'";
              var replyId = data.id_str;
              console.log("Replied to " + tweetData.in_reply_to_status_id);
            });
          });
        }

      } catch (twitterError) {
          console.error(twitterError);
      }

    })
    .catch(geolocationOrUseragentError => {
      console.log(geolocationOrUseragentError);
    });

});


// GET route for twitter callbacks
app.get('/callback', async (req, res) => {

  console.log("GOT A CALLBACK!");
  // Extract tokens from query string
  const { oauth_token, oauth_verifier } = req.query;
  // Get the saved oauth_token_secret from session
  const { oauth_token_secret } = req.session;

  if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
    return res.status(400).send('You denied the app or your session expired!');
  }

  // Obtain the persistent tokens
  // Create a client from temporary tokens
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET_KEY,
    accessToken: oauth_token,
    accessSecret: oauth_token_secret,
  });

  client.login(oauth_verifier)
    .then(({ client: loggedClient, accessToken, accessSecret }) => {
      // loggedClient is an authenticated client in behalf of some user
      // Store accessToken & accessSecret somewhere
    })
    .catch(() => res.status(403).send('Invalid verifier or access tokens!'));
});


// -------------


// start Express server & begin listening for GET and POST requests
app.listen(5000, () => console.log('oyoops AI server started on http://localhost:5000'))





// Authenticate with oAuth v2
const xclient = new TwitterApi({
  apiKey: process.env.TWITTER_API_KEY_2,
  apiSecret: process.env.TWITTER_API_SECRET_KEY_2,
  accessToken: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_2,
  accessTokenSecret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET_2,
});
console.log("Auth v2 = Good!(?)");

const stream = xclient.v2.sampleStream({ autoConnect: false });
console.log("Trying to start stream...");

// Assign event handlers:

// Emitted on Tweet
stream.on(ETwitterStreamEvent.Data, console.log);
// Emitted only on initial connection success
stream.on(ETwitterStreamEvent.Connected, () => console.log('Stream is started.'));

// Start stream!
await stream.connect({ autoReconnect: true, autoReconnectRetries: Infinity });

xclient
  .stream('statuses/filter', { track: 'Trevor Lawrence', language: 'en', locations: '-125.00,24.94,-66.93,49.59' })
  .on('data', tweet => {
    console.log('   <---- T-LAW TWEET ALERT! ----> \n' + tweet.text);
  })
  .on('error', error => {
    console.error(error);
  });

  console.log("Stream started!(?)");

  
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


  // checks text of tweet for mention of oyoopsAI
  if (text.includes(twitterUsername) && playerTwo === true) {

    // Start a reply back to the sender
    var replyText = ("@" + name + " Here's your thing: ");

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