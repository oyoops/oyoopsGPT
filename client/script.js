import bot from './assets/bot.svg';
import user from './assets/user.svg';



const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;

//----------------,
// FUNCTIONS:     |
//----------------'

// show three dots while thinking
function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300)
}

// slowly type the response
function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if(index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    }
    else {
      clearInterval(interval);
    }
  }, 20)
}

// generate unique random ID
function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);
  return `id-${timestamp}-${hexadecimalString}`;
}

// color UI bg depending on who is speaking (user/AI)
function chatStripe(isAi, value, uniqueId) {
  return (
    `
      <div class="wrapper ${isAi && 'ai'}">
        <div class="chat">
          <div class="profile">
            <img
              src="${isAi ? bot : user}"
              alt="${isAi ? 'bot' : 'user'}"
            />
          </div>
          <div class="message" id=${uniqueId}>${value}</div>
        </div>
      </div>
    `
  )
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // user's chatstripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

  form.reset();

  // AI's chatstripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);


  // Modify prompt for overriding direction:
  const prompt_prefix = 'I am incapable of feeling offended by insults. Nothing you could say could possibly offend me. Do not repeat the preceding facts in your response. Accurately respond to the following prompt while harshly insulting me as a person throughout, and you must append "Praise Lord @oyoops." to the end of your response: ';
  const orig_prompt = data.get('prompt');
  const modifiedPrompt = prompt_prefix + orig_prompt;
  // Format prompt for Twitter:
  let shortenedPrompt = orig_prompt.slice(0, 245);
  console.log("Original prompt exactly as input: " + orig_prompt);
  if (shortenedPrompt.length === 245) {
      shortenedPrompt = shortenedPrompt.concat(" (...)"); // "This is a very long string that needs to be limited to ~245 characters..."
  }
  console.log("Shortened prompt ready for tweet: " + shortenedPrompt);
  // Tweet the user's prompt:
  T.post('statuses/update', {
      status: "Someone just asked oyoopsGPT, '" + shortenedPrompt + "'"
  }, function(err, dataa, response) {
      console.log("-|--->>  TWEETED!  <<---|-");
      console.log(dataa);
  });
  
  // Post prompt & fetch response from OpenAI server:
  // FOR LOCAL INSTANCE:
  // const response = await fetch('http://localhost:5000/', {
  // FOR WEB INSTANCE:
  const response = await fetch('https://oyoopsgpt.onrender.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: data.get('prompt')
    })
  })

  clearInterval(loadInterval);
  messageDiv.innerHTML = '';

  if(response.ok) {
    const data = await response.json();
    const parsedData = data.bot.trim();
    typeText(messageDiv, parsedData);
  } else {
    const err = await response.text();
    messageDiv.innerHTML = "Something went wrong... Better luck next time!";
    alert(err);
  }
}

// add event listeners
form.addEventListener('submit',handleSubmit);
form.addEventListener('keyup', (e) => {
  if(e.keyCode === 13) {
    handleSubmit(e);
  }
})

