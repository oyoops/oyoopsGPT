import * as dotenv from 'dotenv';
//import * as request from request = require('request-promise');
import Twitter from 'twitter';
import axios, * as others from 'axios';
import * as req from 'request-promise';

dotenv.config()

//const axios = require('axios')
//const config = require('./config.json');

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

const client = new Twitter({
    access_token_key: getAccessToken().access_token
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


