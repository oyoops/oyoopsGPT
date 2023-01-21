import bot from './assets/bot.svg';
import user from './assets/user.svg';

const DEBUG_MODE = false;

// get objects from DOM
const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
<<<<<<< HEAD
const switchIQ = document.querySelector('switch').value;
=======
>>>>>>> parent of 490fa1e... The fourth test of brain

let loadInterval;

//----------------,
// FUNCTIONS:     |
//----------------'

// show dot-dot-dots while AI is 'thinking'
function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300)
}

// slowly type text into a chatstripe
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

// generate a uniqueID to associate with each AI response
function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);
  return `id-${timestamp}-${hexadecimalString}`;
}

// returns HTML string for a chatstripe depending on who (user/AI) is speaking
function chatStripe(isAi, value, uniqueId) {
  // chatstripe = wrapper element w/ child elements ('chat' contains 'profile' and 'message').
  // if the AI is speaking, the wrapper is given the 'ai' class; if user, no class is given.
  // 'chat' element contains the 'profile' (user/AI pic) and 'message' (text of prompt/response) elements.
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

// run on prompt submission
const handleSubmit = async (e) => {
  //-------------------------------------
  // The following async function runs 
  // when the user submits the form
  // (e.g., hit send button/press enter)
  //-------------------------------------

  // prevent the default form submission action from occurring (i.e., refreshing the page)
  e.preventDefault();

  // create new FormData object using the existing form object (from DOM)
  const data = new FormData(form);

  // insert a chatstripe into the chat container element (here, one to contain the user's submitted prompt)
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

  // reset the form (i.e., clear the prompt input box)
  form.reset();

  // insert a chatstripe into the chat container element (here, one to contain the AI's response)
  const uniqueId = generateUniqueId(); // <--- Need uniqueID for AI's chatstripe function call
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

  // adjust scroll height as user & AI add text lines
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // get the 'message' element from the 'chat' element of the chatstripe (dynamic HTML wrapper element) of the appropriate uniqueID
  const messageDiv = document.getElementById(uniqueId);
  // change text content of this 'message' element to dot-dot-dots until client receives response from server
  loader(messageDiv);

  //
  // Everything is now prepated for the AI's response... 
  // so let's submit the prompt (i.e., invite in the AI's response)
  //

  // (optional: prompt prefix to modify AI response unbeknownst to user client)
  let promptPrefix;
  promptPrefix = '';

  // debug mode?
  let myURLandPort;
  if (DEBUG_MODE) {
    myURLandPort = 'http://localhost:5000/';
  } else {
    myURLandPort = 'https://oyoopsgpt.onrender.com/';
  }
  
  // AWAIT response from server 
  // after sending a POST request
  const response = await fetch(myURLandPort, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prefix: switchIQ,
      prompt: data.get('prompt')
    })
  });

  //
  // If script has reached this point,
  // then the client received a response.
  //

  clearInterval(loadInterval);
  // erase dots so response can be typed on a blank slate
  messageDiv.innerHTML = '';

  // do something with AI's response
  if(response.ok) {
    // response is valid -- Type out the response message in the AI's chatstripe.
    const data = await response.json();
    const parsedData = data.bot.trim();
    typeText(messageDiv, parsedData);
  } else {
    // response is invalid -- Error; give generic error message.
    const err = await response.text();
    messageDiv.innerHTML = "Something went wrong... Better luck next time!";
    alert(err);
  }
}

// add event listeners
// listens for 'submit' event (send button press) and keyboard Enter button press
form.addEventListener('submit',handleSubmit);
form.addEventListener('keyup', (e) => {
  if(e.keyCode === 13) {
    handleSubmit(e);
  }
})

