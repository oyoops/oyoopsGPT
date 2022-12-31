import * as dotenv from 'dotenv';
import Twitter from 'twitter';
import axios, * as others from 'axios';
//import * as req from 'request-promise';
//const request = require('request');

dotenv.config()

const getAccessToken = async () => {
    try {
        const resp = await axios.post(
            'https://api.twitter.com/oauth2/token',
            '',
            {
                params: {
                    'grant_type': 'client_credentials'
                },
                auth: {
                    username: process.env.TWITTER_API_KEY,
                    password: process.env.TWITTER_API_SECRET_KEY
                }
            }
        );
        console.log(resp.data);
    } catch (err) {
        // Handle Error Here
        console.error(err);
    }
};

getAccessToken();

console.log("Access (API) key:");
console.log(process.env.TWITTER_API_KEY);
console.log("Secret (private) key:");
console.log(process.env.TWITTER_API_SECRET_KEY);
console.log("Bearer token (authenticated):");
console.log(getAccessToken());



const client = new Twitter({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET_KEY,
    bearer_token: getAccessToken().access_token
});

// READ TIMELINE:
client.get('statuses/user_timeline', {screen_name: 'oyoops'}, function(error, tweets, response) {
    if (!error) {
        console.log("Here are oyoops' latest banger tweets: ");
        console.log(tweets);
    } else {
        console.log("ERROR WHILE READING TWEETS!");
    }
});

// TWEET:
client.post('statuses/update', {status: 'GM.'}, function(error, tweet, response) {
    if (!error) {
        console.log("I just tweeted the following for oyoops: ");
        console.log(tweet);
    } else {
        console.log("ERROR WHILE TWEETING!");
    }
});


