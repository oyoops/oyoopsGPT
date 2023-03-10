//// Server setup:
import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
//// Twitter:
import Twit from 'twit'
//import * as Twitter from 'twitter-api-v2'
import { ETwitterStreamEvent, TweetStream, TwitterApi, ETwitterApiError } from 'twitter-api-v2';
import needle from 'needle' //HTTP client for twitter
//import got from 'got' //for oauth2 with user contexts
//import * as oauth from 'oauth-1.0a' //for oauth2 with user contexts
//// OpemAI, chatGPT, and DALL-E:
import { Configuration, OpenAIApi } from 'openai'
//import { variations } from 'dalle'
//// Other packages:
//import qs from 'qs'
import path from 'path'
import axios from 'axios'
import useragent from 'express-useragent'
//import multer from 'multer'
//import { send } from 'process'
//import { COLLECTION_FORMATS } from 'openai/dist/base';

const DEBUG_MODE = false;
dotenv.config()
const CALLBACK_URL = "https://ai.oyoops.com/callback";

/* const userClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY_2,
  appSecret: process.env.TWITTER_API_SECRET_KEY_2,
  //accessToken: TWITTER_OYOOPS_ACCESS_TOKEN_2,
  //accessSecret: TWITTER_OYOOPS_ACCESS_TOKEN_SECRET_2,
});
*/

const TClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY_2,
    appSecret: process.env.TWITTER_API_SECRET_KEY_2,
});

// Generate auth link
const authLink = await TClient.generateAuthLink(CALLBACK_URL);
const sendURL = authLink.url;
var saveToken = authLink.oauth_token;
var saveTokenSecret = authLink.oauth_token_secret;
/* // (auth link debug)
console.log("sendURL________=" + sendURL);
console.log("saveToken______=" + saveToken);
console.log("saveTokenSecret=" + saveTokenSecret); */

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

// (primary POST route)
app.post('/', async (req, res) => {  
  //
  // OpenAI Module
  //
  try {
    //var iq = req.body.prefix;
    var prompt = req.body.prompt;
    var reportedPrompt = prompt;
    var actualPrompt = "Please address me as 'Bubba' in your response to the following prompt: " + reportedPrompt;
    
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${actualPrompt}`,
      temperature: 0.2, // Higher values = model will take more risks.
      max_tokens: 4000, // Maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
      top_p: 1, // alternative to sampling with temperature, called nucleus sampling
      frequency_penalty: 0.50, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
      presence_penalty: 0.25, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
    });
    var botResponse = response.data.choices[0].text.trim();

    // respond with bot's [raw] response
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

      // log new prompts as they are received
      console.log(`[ NEW PROMPT ] City: ${city}, State: ${state}, Browser: ${browser}, OS: ${os}, Device: ${device}`);
      console.log(`[  HAS BEEN  ] >> ${actualPrompt}`);
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
        console.log("Auth v1 = Attempted...");

        let rootTweetId = '1609987781484240897'; // only in case of error

        // Write Tweet:

        // compose tweet depending on location
        if (state == "Massachusetts") {
          //   ,--------------------.
          //   | MASSACHUSETTS:     |
          //   '--------------------'
          const rawPrompt = reportedPrompt.substring(0,210).trim();
          if (rawPrompt.length === 210) {rawPrompt = rawPrompt.substring(0, 204) + " (...)"}
          const fixedPrompt = rawPrompt;
          const tweetText = `"` + fixedPrompt + `"` + `\n   - ` + `Some bum from ${city} (most racist city in MA)` + `\n\nTry me! ai.oyoops.com`;
          // Tweet twice!
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
          //   ,--------------------.
          //   | FLORIDA:           |
          //   '--------------------'
          const rawPrompt = reportedPrompt.substring(0,210).trim();
          if (rawPrompt.length === 210) {rawPrompt = rawPrompt.substring(0, 204) + " (...)"}
          const fixedPrompt = rawPrompt;
          const tweetText = `"` + fixedPrompt + `"` + `\n   - ` + `Some freedom-loving Floridian in ${city}` + `\n\nTry me! ai.oyoops.com`;
          // Tweet twice!
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
          // <<----- TEST: TRY TO STREAM ----->>
          const DEBUG_TRY_STREAM = false;
          if (DEBUG_TRY_STREAM) {
            try {
              // Get Timeline
              let tUser = "oyoops";
              let respp = "";
              T.get('statuses/user_timeline', { screen_name: `${tUser}`, count: `50`, exclude_replies: `true`, include_rts: `false` }, function(err, timelineData, response) {
                for (const tStatus in timelineData) {
                  console.log(tStatus.text);
                  respp = respp + "{" + tStatus.text + "}, ";
                }
              });
              console.log(respp);
            } catch (streamErr) { 
              console.log("Stream fail.");
              console.error(streamError);
            }
          }
          // <<------- END STREAM TEST ------->>

        } else {
          //   ,--------------------.
          //   | ALL OTHER STATES:  |
          //   '--------------------'
          const rawPrompt = reportedPrompt.substring(0,210).trim();
          if (rawPrompt.length === 210) {rawPrompt = rawPrompt.substring(0, 204) + " (...)"}
          const fixedPrompt = rawPrompt;
          const tweetText = `"` + fixedPrompt + `"` + `\n   - ` + `Someone from ${city}, ${state}` + `\n\nTry me! ai.oyoops.com`;
          // Tweet twice!
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
        // TWITTER API ERROR
          console.error(twitterError);
      }

    })
    .catch(geolocationOrUseragentError => {
      console.log(geolocationOrUseragentError);
    });

});

// ------------
// GET route for handling twitter (auth) callbacks
app.get('/callback', async (req, res) => {

  console.log("<======= You've Got a Callback! =======>");

  // Extract tokens from query string
  const { oauth_token, oauth_verifier } = req.query;

  // Get the saved oauth_token_secret from session
  const { oauth_token_secret } = req.session;

  // Check if we have everything we need
  if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
    return res.status(400).send('You denied the app or your session expired!');
  }

  // Obtain the persistent tokens...

  // Create a client from temporary tokens
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET_KEY,
    accessToken: oauth_token,
    accessSecret: oauth_token_secret,
  });

  // Attempt login
  client.login(oauth_verifier)
    .then(({ client: loggedClient, accessToken, accessSecret }) => {
      // loggedClient is an authenticated client in behalf of some user
      // Store accessToken & accessSecret somewhere
    })
    .catch(() => res.status(403).send('Invalid verifier or access tokens!'));
});
// ------------




















//
// BETA SECTION:
//

// BEARER AUTH v2 CLIENT:
const token = process.env.TWITTER_BEARER_TOKEN_2;
const bClient = new TwitterApi(token);
console.log("Auth v2 = Attemped via bearer...");

// ATTEMPT TO STREAM:
async function startStream(userName){
  try {

    // Create a SEARCH stream
    const stream = await bClient.v2.searchStream();
    
    // Define rules to delete
    console.log('Attempting to review rules...');
    const rules = await getAllRules();
    const ids = rules.data.map(rule => rule.id);
    // Define rules to add
    const userToTrack = userName;

    // Update ruleset
    console.log('Attempting to set rules...');
    await bClient.v2.updateStreamRules({
      // delete pre-existing rules:
      delete: [
        { ids: ids }
      ],
      // add desired rules:
      add: [
        { value: `from:${userToTrack}`, tag: `track-${userToTrack}` },
      ],
    });

    // on Connection Error Encountered:    
    stream.on(
      ETwitterStreamEvent.ConnectionError,
      err => console.log('Connection error!', err),
    );
    
    // on Connection Closed:
    stream.on(
      ETwitterStreamEvent.ConnectionClosed,
      () => console.log('Connection has been closed.'),
    );
    
    // on Data Received:
    stream.on(
      ETwitterStreamEvent.Data,
      eventData => {
        // Authenticate using a new instance of the Twitter v1 API
        const client = new Twitter({
          consumer_key: process.env.TWITTER_CONSUMER_KEY,
          consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
          access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
          access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        });
        // Respond to the author of the matching tweet with a generic reply
        client.post('statuses/update', {
          status: 'Thank you for mentioning @oyoopsAI!',
          in_reply_to_status_id: eventData.id_str,
        }, function(error, tweet, response) {
          if (error) {
            console.error(error);
          } else {
            console.log(`Successfully responded to tweet ${eventData.id_str}`);
          }
          console.log(eventData);
        });
      }
    );
    
    // on Connected Successfully:
    stream.on(
      ETwitterStreamEvent.Connected,
      eventData => console.log("Successful stream connection! :-D"),
    );

    stream.autoReconnect = true;

  } catch (e) {
    console.error(e);
    console.log("failure...");
  };
}
async function callStartStream() {
  try {
    const stream = await startStream("oyoops");
    // Do something with the stream here, if needed
  } catch (error) {
    console.error(error);
  }
}

/* 

// ...
const tRecentURL = 'https://api.twitter.com/2/tweets/search/recent'; // last 7 days of timeline
const tSampleURL = 'https://api.twitter.com/2/tweets/sample/stream'; // 1% sample of all tweets
const tFilteredStreamURL = 'https://api.twitter.com/2/tweets/search/stream'; // <--- for filtered streams with rules
//const streamURL = 'https://api.twitter.com/2/tweets/search/stream';
const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';


// define filter rules
const rules = [{
    'value': 'Aaron Rodgers -is:retweet', // has:images -is:retweet',
    'tag': 'rodgers'
  },
  {
    'value': 'Jared Goff -is:retweet', // -grumpy',
    'tag': 'goff'
  },
];

async function getAllRules() {

  const response = await needle('get', rulesURL, {
      headers: {
          "authorization": `Bearer ${token}`
      }
  })

  if (response.statusCode !== 200) {
      console.log("Error:", response.statusMessage, response.statusCode)
      throw new Error(response.body);
  }

  return (response.body);
}

async function deleteAllRules(rules) {

  if (!Array.isArray(rules.data)) {
      return null;
  }

  const ids = rules.data.map(rule => rule.id);

  const data = {
      "delete": {
          "ids": ids
      }
  }

  const response = await needle('post', rulesURL, data, {
      headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${token}`
      }
  })

  if (response.statusCode !== 200) {
      throw new Error(response.body);
  }

  return (response.body);

}

async function setRules() {

  const data = {
      "add": rules
  }

  const response = await needle('post', rulesURL, data, {
      headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${token}`
      }
  })

  if (response.statusCode !== 201) {
      throw new Error(response.body);
  }

  return (response.body);

}

// connect to filtered stream 
const tStreamURL = tFilteredStreamURL;
function streamConnect(retryAttempt) {
  const stream = needle.get(tStreamURL, {
    headers: {
      "User-Agent": "v2FilterStreamJS",
      "Authorization": `Bearer ${token}`
    },
    timeout: 21000
  });

  stream.on('data', data => {
    try {
      const json = JSON.parse(data);
      console.log(json);
      // A successful connection resets retry count.
      retryAttempt = 0;
    } catch (e) {
      // Catches error in case of 401 unauthorized error status.
      if (data.status === 401) {
        console.log(data);
        process.exit(1);
      } else if (data.detail === "This stream is currently at the maximum allowed connection limit.") {
        console.log(data);
        console.log(data.detail);
        throw err; //process.exit(1);
      } else {
        // Keep alive signal received. Do nothing.
      }
    }
  }).on('err', error => {
    if (error.code !== 'ECONNRESET') {
      console.log(error.code);
      process.exit(1);
    } else {
      // This reconnection logic will attempt to reconnect when a disconnection is detected.
      // To avoid rate limits, this logic implements exponential backoff, so the wait time
      // will increase if the client cannot reconnect to the stream.
      setTimeout(() => {
        console.warn("A connection error occurred. Reconnecting...")
        streamConnect(++retryAttempt);
      }, 2 ** retryAttempt);
    }
  });
  return stream;
}


////
////
////
//////
////// START FILTERED STREAM !
//////
////
////
////

(async () => {
  let currentRules;

  try {
      // Gets the complete list of rules currently applied to the stream
      currentRules = await getAllRules();

      // Delete all rules. Comment the line below if you want to keep your existing rules.
      await deleteAllRules(currentRules);

      // Add rules to the stream. Comment the line below if you don't want to add new rules.
      await setRules();

  } catch (e) {
      console.error(e);
      console.log(currentRules);
      //process.exit(1);
  }

  // Listen to the stream.
  streamConnect(0);

})();



 */

/* Make a custom request
If you know endpoint and parameters (or you don't want them to be parsed), you can make raw requests using shortcuts by HTTP methods:

getStream()
postStream() or using raw request handler:
sendStream() */

// Sample Stream:

// For v1
//const streamFilter = await bClient.v1.stream.getStream('statuses/filter.json', { track: 'JavaScript,TypeScript' });
// For v2
//const sampleFilterv2 = await bClient.v2.getStream('tweets/sample/stream');

/* // Try to make a stream

console.log("Trying to make a stream...");

// Get currently active rules
const bRules = await bClient.v2.streamRules();
console.log(bRules.data.map(rule => rule.id));


async function deleteSearchFilterRules() {
  try {
    // Delete all search filter rules
    await bClient.updateStreamRules({
      delete: {
        add: null
      }
    });
  } catch (error) {
    console.error(error);
  }
}


try {

} catch {

};



// Add rules
const bAddedRules = await bClient.v2.updateStreamRules({
  add: [
    { value: 'Skylar Thompson', tag: 'st' },
  ],
});

// Delete rules
//const bDeletedRules = await bClient.v2.updateStreamRules({
  //delete: {
  //  ids: ['281646', '1534843'],
  //},
//});



// Get currently active rules
const bbRules = await bClient.v2.streamRules();
console.log(bbRules.data.map(rule => rule.id));

const stream = await bClient.v2.searchStream(); // autoConnect = false is ostensibly v2

// Assign event handlers

// --> when it connects successfully:
stream.on(ETwitterStreamEvent.Connected, () => console.log('Stream started !!!!!!!!!!!!!!!!!!!!!'));
// --> when it fails to connect initially:
stream.on(ETwitterStreamEvent.ConnectError, () => console.error);
// --> when unknown error occurs:
stream.on(ETwitterStreamEvent.Error, () => console.error);
// --> when it finds a tweet that matches its rules:
stream.on(ETwitterStreamEvent.Data, console.log);

// CONNECT
await stream.connect({ autoReconnectRetries: 5 });
console.log("Trying another method...");
//await stream.connect({ autoReconnect: true, autoReconnectRetries: 5 });

/* // v1?
bClient.
  .stream('statuses/filter', { 
    track: 'Skylar Thompson', 
    language: 'en', 
    locations: '-125.00,24.94,-66.93,49.59' 
  })
  .on('data', tweet => {
    console.log('  <---- (ALERT) POTENTIAL SKYLAR THOMPSON SLANDER DETECTED! ----> \n' + tweet.text);
  })
  .on('error', error => {
    console.error(error);
  }); */


async function getAllRules() {
  const response = await needle('get', rulesURL, {
      headers: {
          "authorization": `Bearer ${token}`
      }
  })
  if (response.statusCode !== 200) {
      console.log("Error:", response.statusMessage, response.statusCode)
      throw new Error(response.body);
  }
  return (response.body);
}

async function deleteAllRules(rules) {
  if (!Array.isArray(rules.data)) {
      return null;
  }
  const ids = rules.data.map(rule => rule.id);
  const data = {
      "delete": {
          "ids": ids
      }
  }
  const response = await needle('post', rulesURL, data, {
      headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${token}`
      }
  })
  if (response.statusCode !== 200) {
      throw new Error(response.body);
  }
  return (response.body);
}

// start Express server & begin listening for GET and POST requests
app.listen(5000, () => console.log('<-------  oyoops AI is LIVE  ------->'));


const DEBUG_MASTER = false;
// streaming test
if (DEBUG_MASTER) {
  console.log("Attempting to start streaming...");
  callStartStream();
} else {
  console.log("[Streaming Module: DISABLED]")
}


/* function readLatestTweets(user) {

} */
  
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

