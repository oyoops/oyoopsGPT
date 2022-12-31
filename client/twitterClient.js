import * as dotenv from 'dotenv';
dotenv.config()

import { TwitterApi } from 'twitter-api-v2';

// Start TwitterApi client
const client = new TwitterApi({
    appKey: process.env.TWITTER_APP_API_KEY,
    appSecret: process.env.TWITTER_APP_API_SECRET_KEY,
    accessToken: process.env.TWITTER_OYOOPS_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET
})

const rwClient = client.readWrite

//module.exports = rwClient
export default () => rwClient