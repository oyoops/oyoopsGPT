import rwClient from './twitterClient.js';
import { CronJob } from 'cron';

const job = new CronJob("* * * * *", () => {
    //tweet()
    rwClient.v1.statuses.update(status="GM!");
    console.log('sending the tweet...');
})

job.start();