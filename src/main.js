// "borrowed" from https://stackoverflow.com/a/16348977/5932056
function toColor(val) {
  let str = val.user;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}
// "borrowed" from StackOverflow as well - lost the url
// slightly modified to pass ESLint
function getUrlParam(name) {
    name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
let room = getUrlParam("room") == "" ? "Lobby" : getUrlParam("room");
let base_url = "http://danielrutz.de:3000/api";
const GET_OPTS = {
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + btoa(localStorage.getItem("api_credentials")),
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};

window.onload = () => {
  let chat_room_list = document.getElementById("chat-rooms");
  let historic_messages = document.getElementById("historic-messages");
  let message_form = document.getElementById("message-form");
  let message_input = document.getElementById("message");
  let user_input = document.getElementById("username");
  let room_user_list = document.getElementById("room-users");
  let auth_form = document.getElementById("auth");

  function unlock_page() {
    auth_form.parentNode.removeChild(auth_form);
    setInterval(function() {
      loadRooms();
      loadMessages();
      let totalHeight = document.body.offsetHeight
      let currentScroll = document.body.scrollTop
      let visibleHeight = document.documentElement.clientHeight
      if (totalHeight <= currentScroll + visibleHeight) {
        window.scrollTo(0, document.body.scrollHeight);
      }
    }, 1000);
  }
  function addUsers(messages) {
    let users = new Set(messages.map(message => message.user));
    room_user_list.innerHTML = "";
    for (let user of Array.from(users).sort()) {
      let new_user = document.createElement("li");
      new_user.innerHTML = user;
      let color = toColor(user);
      new_user.style.color = color;
      room_user_list.appendChild(new_user);
    }
  }
  function showMessage(message) {
    let new_message = document.createElement("li");
    let color = toColor(message.user);
    let content = message.message
      .replace(":/", '<img alt="confused face" class="emoji" src="https://emojipedia-us.s3.amazonaws.com/thumbs/120/apple/96/confused-face_1f615.png">')
      .replace(":)", '<img alt="smiling face" class="emoji" src="https://emojipedia-us.s3.amazonaws.com/thumbs/120/apple/96/slightly-smiling-face_1f642.png">')
      .replace(":(", '<img alt="slightly frowning face" class="emoji" src="https://emojipedia-us.s3.amazonaws.com/thumbs/120/apple/96/slightly-frowning-face_1f641.png">')
      .replace(":D", '<img alt="smiling face with mouth open" class="emoji" src="https://emojipedia-us.s3.amazonaws.com/thumbs/120/apple/96/smiling-face-with-open-mouth_1f603.png">')
    var datetime = new Date(message.timestamp);
    var hrs = datetime.getHours();
    var mins = datetime.getMinutes();
    mins = `${mins < 10 ? '0' : ''}${mins}`;
    new_message.innerHTML = `${message.user} ${hrs}:${mins}: ${content}`;
    new_message.title = datetime;
    new_message.style.color = color;
    historic_messages.appendChild(new_message);
  }
  function loadRooms() {
    fetch(base_url + "/chats", GET_OPTS).then(function (response) {
      return response.json();
    })
    .then(function (body) {
      chat_room_list.innerHTML = "";
      for (let room of body) {
        let new_room = document.createElement("li");
        new_room.innerHTML = `<a href="?room=${room}">${room}</a>`;
        chat_room_list.appendChild(new_room);
      }
    });
  }
  function loadMessages() {
    fetch(`${base_url}/chats/${room}`, GET_OPTS).then(function (response) {
      return response.json();
    })
    .then(function (body) {
      historic_messages.innerHTML = "";
      addUsers(body);
      for (let message of body) {
        showMessage(message);
      }
    });
  }
  function sendMessage(username, message) {
    let opts = {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(localStorage.getItem("api_credentials")),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "roomId": room,
        "user": username,
        "message": message
      })
    };
    fetch(`${base_url}/chats/${room}`, opts).then(function (response) {
      return response.json();
    })
    .then(function (body) {
    });
  }
  message_form.addEventListener('submit', e => {
    e.preventDefault();
    let user = user_input.value
    let message = message_input.value;
    if (user.trim() == "" || message.trim() == "") {
        return;  // Don't send empty message
      }
    sendMessage(user, message);
    message_input.value = "";
    loadRooms();
  });
  auth_form.addEventListener('submit', e => {
    e.preventDefault();
    let user = document.getElementById("login").value;
    let pw = document.getElementById("password").value;
    let opts = {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${user}:${pw}`),
      },
    };
    fetch(`${base_url}/chats/`, opts).then(function(response) {
      if (response.status == 200) {
        localStorage.setItem("api_credentials", `${user}:${pw}`);
        unlock_page();
      } else {
        alert("Wrong credentials.")
      }
    });
  })
  if (localStorage.getItem("api_credentials") !== null) {
    unlock_page();
  }
}