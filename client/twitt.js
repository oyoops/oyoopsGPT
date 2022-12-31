import { TwitterApi } from 'twitter-api-v2';
import cron from 'node-cron';
import * as dotenv from 'dotenv';

dotenv.config()
const client = new TwitterApi({
  consumer_key: process.env.TWITTER_APP_API_KEY,
  consumer_secret: process.env.TWITTER_APP_API_SECRET_KEY,
  access_token_key: process.env.TWITTER_OYOOPS_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_OYOOPS_ACCESS_TOKEN_SECRET
});
const rwClient = client.readWrite;

const tweet = async () => {
    try {
        const postTweet = await rwClient.v2.tweet({
            status: 'GM!'//,
            //poll: {
            //    options: ["Yes", "Maybe", "No"],
            //    duration_minutes: 120,
            //}
        });
        console.log("I just tweeted: '" + postTweet + "'");
    } catch (e) {
        console.error(e);
    }
}
  
cron.schedule('* * * * *', tweet);