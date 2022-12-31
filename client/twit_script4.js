import * as dotenv from 'dotenv';
import Twitter from 'twitter';
import axios, * as others from 'axios';

dotenv.config()

// Replace these values with your own API keys
const client = new Twitter({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET_KEY
});
  
// Set a bearer token
client.setBearerToken(process.env.TWITTER_BEARER_TOKEN);

// Post a tweet
client.post('statuses/update', {status: 'hello'}, (error, tweet, response) => {
    if (error) {
        console.error(error);
    } else {
        console.log(tweet);
    }
});