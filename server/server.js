import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import { Configuration, OpenAIApi } from 'openai'
import Twit from 'twit'
import path from 'path'
import axios from 'axios'
import useragent from 'express-useragent'
import multer from 'multer'
//import { variations } from 'dalle'

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

export async function tweetImage(image, description) {
  try {
    // Upload the image to Twitter
    const media = await client.post('media/upload', { media: image });
    // Tweet the image with the description
    await client.post('statuses/update', {
      status: description,
      media_ids: media.media_id_string,
    });
  } catch (error) {
    throw error;
  }
}

/* // tweet image funtion
const tweetImage = callback => {
  setTimeout(callback, 20000);
  
  // Authenticate with Twitter API v1
  const T = new Twit({
    consumer_key: process.env.TWITTER_API_KEY_2,
    consumer_secret: process.env.TWITTER_API_SECRET_KEY_2,
    access_token: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_2,
    access_token_secret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET_2,
  });

  //Tweet with media (picture)
  var b64content = fs.readFileSync('./assets/to_tweet/now/tweet_image.png', { encoding: 'base64' })
  
  //first we must post the media to Twitter
  T.post('media/upload', { media_data: b64content }, function (err, data, response) {
    // now we can assign alt text to the media, for use by screen readers and other text-based presentations and interpreters
    var mediaIdStr = data.media_id_string
    var altText = "WOW, LOOKS GOOD....."
    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

    T.post('media/metadata/create', meta_params, function (err, data, response) {
        if (!err) {
            // now we can reference the media and post a tweet (media will attach to the tweet)
            var params = {
                status: '[OYOOP-E] Someone just made me generate this cool pic on ai.oyoops.com.\nHow does it look? #bot',
                media_ids: [mediaIdStr]
            }
            T.post('statuses/update', params, function (err, data, response) {
                console.log("Tweeted: " + data.text)
            })
        }
    })
  })
} */

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
    var prompt = req.body.prompt;
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
    var botResponse = response.data.choices[0].text.trim();
    res.status(200).send({
      bot: botResponse
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
      // log new prompt received
      console.log(`[ NEW PROMPT ] City: ${city}, State: ${state}, Browser: ${browser}, OS: ${os}, Device: ${device}`);
      console.log(`[  HAS BEEN  ] >> ${prompt}`);
      console.log(`[  RECEIVED  ] @@ ${botResponse}`);

      // Connect to Twitter and tweet the prompt/response
      try {
        // Authenticate with oAuth v1
        const T = new Twit({
          consumer_key: process.env.TWITTER_API_KEY_2,
          consumer_secret: process.env.TWITTER_API_SECRET_KEY_2,
          access_token: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_2,
          access_token_secret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET_2,
        });
        // Note: If Twitter API fails to authenticate, the rest of this block will not run.

        //console.log(rootTweetId);
        var rootTweetId = '1609987781484240897';
        // formulate tweet body depending on conditions
        if (state == "Massachusetts") {
          const tweetText = `[oyoopsGPT] Some Celtics-loving trashbag from ${state} just said "` + req.body.prompt.trim() + '" to me on ai.oyoops.com #bot';
          // Tweet!
          T.post('statuses/update', { status: `${tweetText}` }, function(err, tweetData, response) {
            console.log("Tweeted: '" + tweetData.text) + "'";
            rootTweetId = tweetData.id_str;
            // FOLLOW-UP PROMPT TWEET WITH RESPONSE REPLY TWEET:
            var replyToId = rootTweetId;
            var botReply = botResponse.substring(0,220).trim();
            if (botReply.length === 220) {botReply = botReply.substring(0, 214) + " (...)"}
            var replyTweetText = '@oyoops I kindly responded, "' + botReply + '"' + ' #bot';
            T.post('statuses/update', { status: `${replyTweetText}`, in_reply_to_status_id: `${replyToId}` }, function(err, data, response) {
              console.log("Replied: '" + data.text) + "'";
              var replyId = data.id_str;
              console.log("Replied to ID: " + replyToId);
            });
          });
        } else if (state == "Florida") {
          const tweetText = `[oyoopsGPT] Someone from ${city}, ${state} just said "` + req.body.prompt.trim() + '" to me on ai.oyoops.com #bot';
          // Tweet!
          T.post('statuses/update', { status: `${tweetText}` }, function(err, tweetData, response) {
            console.log("Tweeted: '" + tweetData.text) + "'";
            rootTweetId = tweetData.id_str;
            // FOLLOW-UP PROMPT TWEET WITH RESPONSE REPLY TWEET:
            var replyToId = rootTweetId;
            var botReply = botResponse.substring(0,220).trim();
            if (botReply.length === 220) {botReply = botReply.substring(0, 214) + " (...)"}
            var replyTweetText = '@oyoops I kindly responded, "' + botReply + '"' + ' #bot';            T.post('statuses/update', { status: `${replyTweetText}`, in_reply_to_status_id: `${replyToId}` }, function(err, data, response) {
              console.log("Replied: '" + data.text) + "'";
              console.log(data);
              var replyId = data.id_str;
              console.log("Replied to ID: " + replyToId);
            });
          });
        } else {
          const tweetText = `[oyoopsGPT] Somebody in ${city}, ${state} just said "` + req.body.prompt.trim() + '" to me on ai.oyoops.com #bot';
          // Tweet!
          T.post('statuses/update', { status: `${tweetText}` }, function(err, tweetData, response) {
            console.log("Tweeted: '" + tweetData.text) + "'";
            rootTweetId = tweetData.id_str;
            // FOLLOW-UP PROMPT TWEET WITH RESPONSE REPLY TWEET:
            var replyToId = rootTweetId;
            var botReply = botResponse.substring(0,220).trim();
            if (botReply.length === 220) {botReply = botReply.substring(0, 214) + " (...)"}
            var replyTweetText = '@oyoops I kindly responded, "' + botReply + '"' + ' #bot';            T.post('statuses/update', { status: `${replyTweetText}`, in_reply_to_status_id: `${replyToId}` }, function(err, data, response) {
              console.log("Replied: '" + data.text) + "'";
              var replyId = data.id_str;
              console.log("Replied to ID: " + replyToId);
            });
          });
        }
        // Tweet!
        //const tweetText = `[oyoopsGPT] Somebody from ${city}, ${state} using ${browser} on ${os} ${device} just said "` + req.body.prompt.trim() + '" to me on ai.oyoops.com #bot';
        //T.post('statuses/update', { status: `${tweetText}` }, function(err, data, response) {
        //  console.log(data);
        //});


        /* // FOLLOW-UP PROMPT TWEET WITH RESPONSE REPLY TWEET:
        var replyTo = rootTweetId;
        var replyTweetId = '0';
        var replyTweetText = '@oyoops ... to which I kindly responded, "' + botResponse.substring(0,210).trim + '"' + '\n\n' + 'How did I do? #bot';
        T.post('statuses/update', { status: `${replyTweetText}`, in_reply_to_status_id: `${replyTo}` }, function(err, data, response) {
          console.log("Replied: '" + data.text) + "'";
          replyTweetId = data.id;
        });
        console.log("Replied to ID: " + replyTweetId); */

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
    //    consumer_key: process.env.TWITTER_API_KEY_2,
    //    consumer_secret: process.env.TWITTER_API_SECRET_KEY_2,
    //    access_token: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_2,
    //    access_token_secret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET_2,
    //  });

    //  const twitterUsername = "oyoops";
    //  var stream = T.stream('statuses/filter', { track: twitterUsername });
    //  stream.on('tweet', pressStart);
    //} catch (streamError) {
    //  console.error(streamError);
    //}

});

//
// OYOOP-E Module
//
const upload = multer();

// POST route for OYOOP-E image generator
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Generate a variation of the image
    const variation = await variations(req.file.buffer);

    // Tweet the image with a description
    await tweetImage(variation, 'Check this thing out:');

    res.send('Image tweeted successfully.');
  } catch (error) {
    res.status(500).send(error.message);
  }
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