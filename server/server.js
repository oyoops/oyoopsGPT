import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import { Configuration, OpenAIApi } from 'openai'

// load .env vars
dotenv.config()

// define a configuration for an OpenAI instance
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// create the OpenAI instance
const openai = new OpenAIApi(configuration);

// create the Express server
const app = express()
app.use(cors())
app.use(express.json())

// (dummy GET route)
app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from oyoops AI!'
  })
})

// (dummy POST route)
app.post('/', async (req, res) => {
  // send user's input as a payload to OpenAI API
  try {
    // get user's prompt (immediate)
    const prompt = req.body.prompt;
    // get AI's response (***async***)
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0.25, // Higher values means the model will take more risks.
      max_tokens: 3000, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
      top_p: 1, // alternative to sampling with temperature, called nucleus sampling
      frequency_penalty: 0.75, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
      presence_penalty: 0.25, // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
    });
    // send back the AI's message as the response to client
    res.status(200).send({
      bot: response.data.choices[0].text
    });

  } catch (error) {
    // if error, send back an error as the response to client
    console.error(error)
    res.status(500).send(error || 'UH-OH!! Something went wrong. Better luck next time...');
  }
})

// make server begin listening for GET and POST requests
app.listen(5000, () => console.log('oyoops AI server started on http://localhost:5000'))
