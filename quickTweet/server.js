import express from 'express'
import * as dotenv from 'dotenv'
import * as Twitter from 'twitter';
import sentiment from 'sentiment';

// load .env vars
dotenv.config()

// Create an Express application 
const app = express();
 
// Create a new Twitter client 
const client = new Twitter({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET_KEY,
    access_token: process.env.TWITTER_OYOOPS_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET,
});

// Set up a stream listener for tweets from @elon 

const stream = client.stream('statuses/filter', {track: '@elon'});

stream.on('data', (tweet) => {

    console.log(tweet);

    let score = sentiment(tweet.text).score;

    let replyText;

    if (score > 0) {replyText= "I have great news! "} else if (score < 0) {replyText= "Oh no, that's not good. "} else {replyText= "Ho hum... "}

    const params = {status: `@${tweet.user.screenName} ${replyText} The TrashScore of the tweet is ${score}.`, inReplyToStatusId: tweet.id};

    client.post('statuses/update', params, function(error, tweet, response){
        if (!error) {
            console.log(`Replied to Elon successfully!`)
        } 
    }); 
});