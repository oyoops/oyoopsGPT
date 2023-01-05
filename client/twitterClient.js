import * as dotenv from 'dotenv';
dotenv.config()

import { TwitterApi } from 'twitter-api-v2';

// Start TwitterApi client
const client = new TwitterApi({
    appKey: process.env.TWITTER_APP_API_KEY_2,
    appSecret: process.env.TWITTER_APP_API_SECRET_KEY_2,
    accessToken: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_2,
    accessSecret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET_2
})

const rwClient = client.readWrite

//module.exports = rwClient
export default () => rwClient