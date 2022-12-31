import Twit from 'twit';
import * as dotenv from 'dotenv';
import fs from "fs";

dotenv.config()

// Authenticate with oAuth v1
const T = new Twit({
    consumer_key: process.env.TWITTER_APP_API_KEY,
    consumer_secret: process.env.TWITTER_APP_API_SECRET_KEY,
    access_token: process.env.TWITTER_OYOOPS_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET,
});

// Tweet every 60 seconds
//setInterval(function() {
//    T.post('statuses/update', { status: 'GM!' }, function(err, data, response) {
//      console.log(data);
//    });
//}, 60000); // 60000 ms = 1 minute

// Tweet now
//T.post('statuses/update', { status: 'GM!!' }, function(err, data, response) {
//    console.log(data);
//});

// Reformat query to fit in a tweet
const shortenedPrompt = data.get('prompt').slice(0, 245);
if (shortenedPrompt.length === 245) {
    shortenedPrompt = shortenedPrompt.concat(" (...)"); // "This is a very long string that needs to be limited to 245 characters..."
}
console.log("Shortened prompt for tweet: " + shortenedPrompt);
T.post('statuses/update', {
    status: "Someone just asked oyoopsGPT, '" + data.get('prompt') + "'"
}, function(err,data,response) {
    console.log("----->>  TWEETED!  <<-----");
    console.log(data);
});

// Tweet with media (picture)
//var b64content = fs.readFileSync('./assets/to_tweet/now/tweet_image.png', { encoding: 'base64' })
// first we must post the media to Twitter
//T.post('media/upload', { media_data: b64content }, function (err, data, response) {
//    // now we can assign alt text to the media, for use by screen readers and other text-based presentations and interpreters
//    var mediaIdStr = data.media_id_string
//    var altText = "YELLOW BANANA  :^D  WOW, LOOKS GOOD....."
//    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
//
//    T.post('media/metadata/create', meta_params, function (err, data, response) {
//        if (!err) {
//            // now we can reference the media and post a tweet (media will attach to the tweet)
//            var params = {
//                status: 'loving life #nofilter',
//                media_ids: [mediaIdStr]
//            }
//            T.post('statuses/update', params, function (err, data, response) {
//                console.log(data)
//            })
//        }
//    })
//})




