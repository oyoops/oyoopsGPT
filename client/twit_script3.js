import * as dotenv from 'dotenv';
import Twitter from 'twitter';
import axios, * as others from 'axios';

dotenv.config()

const getAccessToken = () => {
    try {
        // try to get the auth creds from .env and the bearer token from Twitter API
        const options = {
            url: 'https://api.twitter.com/oauth2/token',
            method: 'POST',
            auth: {
              username: process.env.TWITTER_API_KEY,
              password: process.env.TWITTER_API_SECRET_KEY
            },
            data: {
              grant_type: 'client_credentials'
            }
        };
        axios(options)
            .then(response => {
                console.log(response.data);
                return response.data
            })
            .catch(error => {
                // most errors
                //console.log(error);
                console.log("error!!");
            });
    } catch (err) {
        // error catch-all
        //console.error(err);
        console.log("error!!!");
    }
};

console.log(await getAccessToken.access_token);

console.log("Access (API) key:");
console.log(process.env.TWITTER_API_KEY);
console.log("Secret (private) key:");
console.log(process.env.TWITTER_API_SECRET_KEY);
//console.log("Bearer token (authenticated):");
//console.log(bear);

// attempt to instantiate Twitter w/ auth creds + received bearer token
const client = new Twitter({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET_KEY,
    bearer_token: (async () => {
        console.log(await getAccessToken())
    })()
});
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
console.log("Done!");