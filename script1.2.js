var virtuallyhuman = null;
var needMicAccess = false;
var host = window.location.hostname;
// 8704216815295154889
// const avatarId = getParameter('avatarId');
//2141213934426606895
//1803810283631233690
const avatarId = "834286566626447339";
const connect = getBooleanParameter("connect");
let sessionId;
let newChat = true;
let companyId = "10";
let projectId = "7";
let isUnderWaterMsg = false;
// id of video element to display avatar
let isEventListenerAdded = false;
let videoElements = {
  remoteVideo: "myvideo",
};

function authSuccessHandler(resp) {
  console.log("Auth succeeded!", resp);
  localStorage.clear();

  virtuallyhuman.connectGateway();
}
document.addEventListener("DOMContentLoaded", function () {
      function detectView() {
        if (window.innerWidth <= 768) {
          console.log("Mobile View");
          // Apply mobile-specific changes here
        } else {
          console.log("Desktop View");
          // Apply desktop-specific changes here
        }
      }

      detectView()
      window.onresize = detectView; 
    });

function authFailHandler(error) {
  console.error("Auth failed: ", JSON.stringify(error));
  Swal.fire({
    title: "Authentication Error",
    html: `<div>${error.errorTitle}: ${
      error.errorTitle == "Invalid Avatar Id"
        ? "We could not find an avatar matching this ID: " + avatarId
        : error.message
    }</div>`,
  });
}

function showMicPermissionsErrorDialog() {
  Swal.fire({
    html: `
        <h2 style="margin-top:0px;margin-bottom:0px;margin-left:23px;margin-right:23px">Your microphone is disabled <h2>
        <div style='width: 100%; text-align:left; font-size: 18px; overflow: auto; height: auto;' >
          <ol type="1" style="margin: 4px;">
            <li> Click the icon in your browser's address bar
            <li> Enable your microphone
          </ol>
        </div>
        `,
    imageUrl: "https://virtuallyhuman.com/home/assets/img/MicPermissions.png",
    imageWidth: 200,
    imageHeight: 200,
    imageAlt: "Permission image",
  });
}

function micAccessUpdateHandler(details) {
  console.log("In micAccessUpdateHandler html page - details = ", details);
  if (!details.permissionGranted) {
    micUpdateHandler(false);
  }

  if (details.needMicAccess) {
    needMicAccess = true;
  } else {
    needMicAccess = false;
  }
}

function buttonClickFeedback(buttonId) {
  const button = document.getElementById(buttonId);
  button.classList.add("pulse");
  setTimeout(() => {
    button.classList.remove("pulse");
  }, 200); // Briefly show feedback for 0.2s
}
function initBumpingEffect() {
  const micButton = document.getElementById("micButton");

  // Add bump class for the first bump
  micButton.classList.add("bump");

  setTimeout(() => {
    micButton.classList.remove("bump");
  }, 2800); 

  setTimeout(() => {
    micButton.classList.add("bump");
  }, 3200);

  setTimeout(() => {
    micButton.classList.remove("bump");
  }, 5200); 
  setTimeout(() => {
    micButton.classList.add("bump");
  }, 5600); 

}
function speakerUpdateHandler(status) {
  console.log("Speaker Update status - " + status);
  if (status) {
    document.getElementById("speakerButton").innerHTML =
      '<i class="material-icons">volume_up</i>';
  } else {
    document.getElementById("speakerButton").innerHTML =
      '<i class="material-icons"style="color: #ecc47a;">volume_off</i>';
  }
}
let bumpEffectTriggered = false; 
function micUpdateHandler(status) {
  console.log(bumpEffectTriggered);
  console.log("Mic Update status - " + status);
  if (status) {
    document.getElementById("micButton").innerHTML =
      '<i class="material-icons">mic</i>';
  } else {
    document.getElementById("micButton").innerHTML =
      '<i class="material-icons" style="color: #ecc47a;">mic_off</i>';
      if (!bumpEffectTriggered) {
        initBumpingEffect();
        console.log("enterrr");
        
        bumpEffectTriggered = true; // Set flag to true after calling the effect
      }
  }
}


async function mediaConnectHandler() {
  console.log("In mediaConnectHandler");
  virtuallyhuman.setMicEnabled(false);
  virtuallyhuman.setSpeakerEnabled(true);
  // initBumpingEffect();
  // document.getElementById("connect").disabled = true;
  document.getElementById("submitButton").disabled = false;
  document.getElementById("micButton").disabled = false;
  document.getElementById("speakerButton").disabled = false;


  if(isUnderWaterMsg){
    let msg = "Hey";
    const payload = {
      userId: `user_${sessionId}`,
      companyId: companyId,
      projectId: projectId,
      sessionId: sessionId,
      content: msg,
      newChat: newChat
    };
    try {
      const response = await ApiCall(payload);
  
      await handleMessageResponse(response?.data);
  
    } catch (error) {
      console.error("Error sending message:", error);
      errorShowFun(error)
    }
  }else{
    virtuallyhuman.sendMessage("Welcome to Virtually Human. How can I help you?");
    addMessage("Welcome to Virtually Human", "chatbot");
    addMessage("How can I help you?", "chatbot");
  }
}

function mediaDisconnectHandler() {
  console.log("In mediaDisconnectHandler");
  // document.getElementById("connect").disabled = false;
  document.getElementById("disconnect").disabled = true;
  document.getElementById("submitButton").disabled = true;
  document.getElementById("micButton").disabled = true;
  document.getElementById("speakerButton").disabled = true;
}

async function websocketMessageHandler(resp) {
  let messageType = resp.messageType;
  if (messageType === window.Trulience.MessageType.ChatText) {
    // Ignore the acknowledgement messages.
    if (
      resp.status === "MESSAGE_DELIVERED_TO_VPS" ||
      resp.status === "MESSAGE_NOT_DELIVERED_TO_VPS"
    ) {
      return;
    }

    if (resp.sttResponse === true) {
      // Received stt message.
      console.log("Received STT Message - " + resp.messageArray[0].message);
      let msg = resp.messageArray[0].message;
      sendMessageFunc(msg);
      const payload = {
        userId: `user_${sessionId}`,
        companyId: companyId,
        projectId: projectId,
        sessionId: sessionId,
        content: msg,
        newChat: newChat
      };
      try {
        const response = await ApiCall(payload);
    
        await handleMessageResponse(response?.data);
    
      } catch (error) {
        console.error("Error sending message:", error);
        errorShowFun(error)
      }
      newChat = false
    }
  }
}
async function websocketConnectHandler(resp) {
  sessionId = resp.sessionId;
  // sessionId = "1111"
}
  async function handleMessageResponse(message) {
    console.log('====================================');
    console.log(message);
    console.log('====================================');
    const sendDigitalHumanMessage = async (digitalHumanMessages) => {
      const processedMessages = digitalHumanMessages
        .filter(message =>  message && message.trim())
        .map(digitalMessage => {
          const processedMessage = digitalMessage.includes('%')
            ? digitalMessage.replace(/%(.+)%/g, "<$1>")
            : digitalMessage;
          return `<trl-content queue="true" />${processedMessage}`;
        });
    
      for (const message of processedMessages) {
        virtuallyhuman.sendMessage(message);
        await waitForAvatarIdle();  
      }
    };
   
    if (Array.isArray(message)) {
      for (let j = 0; j < message.length; j++) {
        let messages = message[j];
        if (messages.reply_type === "TEXT") {
          
          if (messages?.data?.text && messages?.digital_human?.length > 0) {
            
            for (let i = 0; i < messages.digital_human.length; i++) {
              
              // Ensure we're within bounds of both arrays to prevent errors
              const textMessage = messages.data.text[i] || ""; 
              const digitalHumanMessage = messages.digital_human[i] || "";
              
              if (textMessage) await addMessage(textMessage, "chatbot");
              if (digitalHumanMessage) await sendDigitalHumanMessage([digitalHumanMessage]);
            }
    
          } else if (messages?.data?.text) {
    
            for (let i = 0; i < messages.data.text.length; i++) {
              await addMessage(messages.data.text[i], "chatbot");
              await sendDigitalHumanMessage([messages.data.text[i]]);
            }
    
          } else if (messages?.digital_human?.length > 0) {
            await sendDigitalHumanMessage(messages.digital_human);
          }
        }

        if (messages.reply_type === "VIDEO") {
          if (messages?.digital_human?.length > 0 && messages?.data?.text) {
           
           await sendDigitalHumanMessage(messages?.digital_human);
       
            const validTexts = messages.data.text.filter(text => text !== null);
            for (const text of validTexts) {
               addMessageFunc(text, "chatbot");
              await delay(1500);
            }
          } else if (messages?.data?.text) {
       
            const validTexts = messages?.data?.text.filter(text => text !== null);
            for (const text of validTexts) {
               addMessageFunc(text, "chatbot");
              await delay(1500);
            }
       
            if (validTexts.length > 0) {
             await sendDigitalHumanMessage(validTexts);
            }
          } else if (messages?.digital_human?.length > 0) {
          
            await sendDigitalHumanMessage(messages?.digital_human);
          }
        
     
          let videoLink = messages?.data?.video_link;
          await addVideoContainer(videoLink, "chatbot");
        }
         if(messages.reply_type === "IMAGE" || messages.reply_type === "IMAGES") {
          if (messages?.digital_human?.length > 0 && messages?.data?.text) {
          await  sendDigitalHumanMessage(messages?.digital_human);
            
        
            const validTexts = messages.data.text.filter(text => text !== null);
            for (const text of validTexts) {
               addMessageFunc(text, "chatbot");
              await delay(1500);
            }
          } else if (messages?.data?.text) {
            const validTexts = messages.data.text.filter(text => text !== null);
            for (const text of validTexts) {
               addMessageFunc(text, "chatbot");
              await delay(1500);
            }
        
     
            if (validTexts.length > 0) {
            await  sendDigitalHumanMessage(validTexts);
            }
          } else if (messages?.digital_human?.length > 0) {
            await sendDigitalHumanMessage(messages?.digital_human);
          }
        
          await addImageContainer(messages?.data?.image_link, "chatbot");
        }
         if (messages.reply_type === "BUTTON" || messages.reply_type === "BUTTONS") {
          const buttonData = messages?.data?.buttons.map(button => button);
          const btnText = messages?.data?.text;
          if (messages?.digital_human?.length > 0 && btnText) {
          await  sendDigitalHumanMessage(messages?.digital_human);
          for (const text of btnText) {
            if (text && text.trim()) {
              addMessageFunc(text, "chatbot"); // Removed await to keep flow
            }
          }
          } else if (btnText) {
      
             addMessageFunc(btnText, "chatbot");
        
          await  sendDigitalHumanMessage(btnText);
          } else if (messages?.digital_human?.length > 0) {
          
          await  sendDigitalHumanMessage(messages?.digital_human);
          }
          await addButtons(buttonData, "chatbot");
        }
        if (messages.reply_type === "QUICK_REPLY") {
          const quickReplyData = messages?.data?.quick_replies.map(button => button);
          const btnText = messages?.data?.text;
          
          if (messages?.digital_human?.length > 0 && btnText?.length > 0) {
            // Handle both digital human messages and text display
            await sendDigitalHumanMessage(messages.digital_human);
            for (const text of btnText) {
              if (text && text.trim()) {
                addMessageFunc(text, "chatbot"); // Removed await to keep flow
              }
            }
          } else if (btnText) {
       
             addMessageFunc(btnText, "chatbot");
       
           await sendDigitalHumanMessage(messages?.data?.text);
          } else if (messages?.digital_human?.length > 0) {
       
            sendDigitalHumanMessage(messages?.digital_human);
          }
          await addQuickReply(quickReplyData, "chatbot");
        }
      }
    }
  }; 
const avatarStatus = (resp)=>{
  console.log("STATUSSSSSS",resp.avatarStatus);
  
}
const waitForAvatarIdle = () => {
  return new Promise((resolve) => {
    const checkStatus = (resp) => {
      console.log("STATUSSSSSS", resp.avatarStatus);

      if (resp.avatarStatus === 0) {
        virtuallyhuman.off('avatar-status-update', checkStatus);
        resolve();
      }
    };
    virtuallyhuman.on('avatar-status-update', checkStatus);
  });
};

function errorShowFun(errorMessage){
  const errorMsgElement = document.getElementById("companyErrorMsg");
    errorMsgElement.style.visibility = "visible";
    errorMsgElement.innerText = errorMessage.error;
   
    setTimeout(() => {
      errorMsgElement.style.visibility = "hidden";
    }, 5000);
  }
window.onload = () => {
  if (connect) {
    startCall();
  }
};

window.onunload = function () {
  this.endCall();
};

function getBooleanParameter(paramName) {
  const paramValue = getParameter(paramName);
  return paramValue !== null && paramValue.toLowerCase() === "true";
}

function getParameter(paramName) {
  const urlParams = new URLSearchParams(window.location.search);
  const paramValue = urlParams.get(paramName);
  return paramValue;
}
function startCall() {
  // Clear exsiting object.
  if (virtuallyhuman) {
    virtuallyhuman = null;
  }
  // buttonClickFeedback("connect")
  const homeDiv = document.getElementById('homeDiv');
  const rootDiv = document.getElementById('rootDiv');
  const connectButtonDiv = document.getElementById('connectButtonDiv');
  connectButtonDiv.classList.add('hidden');
  homeDiv.classList.remove('small');
  homeDiv.classList.add('large');
  rootDiv.classList.add('visible');
  connectButtonDiv.classList.add('hidden');

  // Create a new virtuallyhuman object.
  virtuallyhuman = Trulience.Builder()
    .setAvatarId(avatarId)
    .setUserName("Guest")
    .enableAvatar(true)
    .setRetry(false)
    .registerVideoElements(videoElements)
    .build();

  // Register for the events.
  virtuallyhuman.on("mic-access", micAccessUpdateHandler);
  virtuallyhuman.on("auth-success", authSuccessHandler);
  virtuallyhuman.on("auth-fail", authFailHandler);
  virtuallyhuman.on("speaker-update", speakerUpdateHandler);
  virtuallyhuman.on("mic-update", micUpdateHandler);
  virtuallyhuman.on("websocket-message", websocketMessageHandler);
  virtuallyhuman.on("media-connected", mediaConnectHandler);
  virtuallyhuman.on("media-disconnected", mediaDisconnectHandler);
  virtuallyhuman.on("load-progress", loadProgress);
  virtuallyhuman.on("websocket-connect", websocketConnectHandler);
  // virtuallyhuman.on("avatar-status-update",avatarStatus);
  // Trigger auth.
  virtuallyhuman.authenticate();
  document.getElementById("textBox").disabled = false
  document.getElementById("minimizeMaximizeButton").style.display = "block"

  document.getElementById("disconnect").disabled = false;
  // document.getElementById("connect").disabled = true;
  document.getElementById("submitButton").disabled = false;

  //
  // document.getElementById("connect").style.cursor = "default";
  document.getElementById("disconnect").style.cursor = "pointer";
  document.getElementById("submitButton").style.cursor = "pointer";
  document.getElementById("micButton").style.cursor = "pointer";
  document.getElementById("speakerButton").style.cursor = "pointer";
}

function endCall(reason) {
  buttonClickFeedback("disconnect")
  const homeDiv = document.getElementById('homeDiv');
  const rootDiv = document.getElementById('rootDiv');
  const connectButtonDiv = document.getElementById('connectButtonDiv');
  connectButtonDiv.classList.remove('hidden');
  homeDiv.classList.remove('large');
  homeDiv.classList.add('small');
  rootDiv.classList.remove('visible');
  connectButtonDiv.classList.remove('hidden');
  if (virtuallyhuman) {
    virtuallyhuman.disconnectGateway(reason);
    // Unregister for the events.
    virtuallyhuman.off("mic-access", micAccessUpdateHandler);
    virtuallyhuman.off("auth-success", authSuccessHandler);
    virtuallyhuman.off("speaker-update", speakerUpdateHandler);
    virtuallyhuman.off("mic-update", micUpdateHandler);
    virtuallyhuman.off("websocket-message", websocketMessageHandler);
    virtuallyhuman.off("media-connected", mediaConnectHandler);
    virtuallyhuman.off("media-disconnected", mediaDisconnectHandler);
    virtuallyhuman.off("load-progress", loadProgress);

    document.getElementById("minimizeMaximizeButton").style.display = "none"

    document.getElementById("progress").innerHTML = "Progress: 0%";
    // document.getElementById("connect").style.cursor = "pointer";
    document.getElementById("disconnect").style.cursor = "default";
    document.getElementById("submitButton").style.cursor = "default";
    document.getElementById("micButton").style.cursor = "default";
    document.getElementById("speakerButton").style.cursor = "default";
    document.getElementById(videoElements.remoteVideo).srcObject = null;
    document.getElementById("chat-container").innerHTML = "";
  }
}

function loadProgress(progress) {
  console.log("Progress - " + progress.percent);
  document.getElementById("progress").innerHTML =
    "Progress: " + (progress.percent * 100).toFixed(0) + "%";
  if (progress.percent === 1) {
    document.getElementById("progress").style.visibility = "hidden";
    document.getElementById("progress").style.display = "none";
  } else {
    document.getElementById("progress").style.visibility = "visible";
    document.getElementById("progress").style.display = "flex";
  }
}

function toggleMic() {
  let permissionGranted = virtuallyhuman.isPermissionGranted("mic");
  console.log("permissionGranted - " + permissionGranted);
  // buttonClickFeedback("micButton");
  if (permissionGranted && !needMicAccess) {
    virtuallyhuman.toggleMic();
  } else {
    showMicPermissionsErrorDialog();
  }
}

function toggleSpeaker() {
  buttonClickFeedback("speakerButton");
  virtuallyhuman.toggleSpeaker();
}

const handleKeyPress = async () => {
  const textBox = document.getElementById("textBox");
  if (!isEventListenerAdded) {
    textBox.addEventListener("keydown", async (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        var msg = textBox.value.trim();
        if (msg === "") {
          event.preventDefault();
          return;
        }  
        sendMessageFunc(msg);
        console.log(msg);
        textBox.value = "";
        const payload = {
          userId: `user_${sessionId}`,
          companyId: companyId,
          projectId: projectId,
          sessionId: sessionId,
          content: msg,
          newChat: newChat
        };
        try {
          const response = await ApiCall(payload);
          if (response.error) {
            errorShowFun(response.error)
            throw new Error(response.error);
          }
          await handleMessageResponse(response?.data);
      
        } catch (error) {
          console.error("Error sending message:", error);
          errorShowFun(error)
        }
        newChat = false
        event.preventDefault(); // Prevents the default new line behavior
      }
    });
    isEventListenerAdded = true;
  }
};

async function sendText() {
  var msg = document.getElementById("textBox").value;
  if(msg===""){
    return
  }  
  document.getElementById("textBox").value = "";
  sendMessageFunc(msg);
  const payload = {
    userId: `user_${sessionId}`,
    companyId: companyId,
    projectId: projectId,
    sessionId: sessionId,
    content: msg,
    newChat: newChat
  };
  try {
    const response = await ApiCall(payload);
    if (response.error) {
      errorShowFun(response.error)
      throw new Error(response.error);
    }
    await handleMessageResponse(response?.data);

  } catch (error) {
    console.error("Error sending message:", error);
    errorShowFun(error)
  }
  newChat = false
}

const chatContainer = document.getElementById("chat-container");

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

scrollToBottom(); 
function linkifyText(text) {
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

  return text.replace(urlPattern, (url) => {
    const fullUrl = url.startsWith('www.') ? `http://${url}` : url;
    return `<a href="${fullUrl}" target="_blank">${url}</a>`;
  });
}

function addMessage(message, sender = "user") {
  return new Promise(async (resolve) => {

    const messageRow = document.createElement("div");
    messageRow.classList.add("chat-row", sender);
    
    const rootDiv = document.getElementById("rootDiv");
    const isNightMode = rootDiv.classList.contains("night-mode");
    messageRow.style.opacity = 0; 
    messageRow.style.transform = "translateY(20px)"; 

    const balloon = document.createElement("div");
    balloon.classList.add("chat-balloon");

    if (sender === "chatbot") {
      balloon.classList.add(isNightMode ? "chatbot" : "chatbot");
    } else {
      balloon.classList.add(isNightMode ? "user" : "user");
    }
    const messageSpan = document.createElement("span");
    messageSpan.innerHTML = await linkifyText(message);
    balloon.append(messageSpan);
    messageRow.appendChild(balloon);
    chatContainer.insertBefore(messageRow, chatContainer.firstChild);

    scrollToBottom();

    setTimeout(() => {
      messageRow.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      messageRow.style.opacity = 1;
      messageRow.style.transform = "translateY(0)";

  
      setTimeout(() => {
        resolve();
      }, 500);
    }, 100);
  });
}

function sendMessageFunc(message) {
  const input = document.querySelector("textarea");

  if (message.trim() !== "") {
    addMessage(message, "user");
    input.value = "";
  }
}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function ApiCall (payload){
  try {
    const response = await axios.post("https://virtual-human-backend.onrender.com/send-message", payload, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
    return response?.data;
  } catch (error) {
    return {
      error:error?.response?.data?.message
    };
  }
}

function toggleSize() {
  const homeDiv = document.getElementById('homeDiv');
  const mainContent = document.querySelector('.content');
  const toggleButton = document.getElementById('toggleSizeButton');
  const isMinimized = homeDiv.classList.contains('small');

  if (isMinimized) {
    // Maximize the UI
    homeDiv.classList.remove('small');
    homeDiv.classList.add('large');
    mainContent.classList.remove('hidden'); 
    toggleButton.innerHTML = '<i class="material-icons">remove</i>'; // Icon for minimize
  } else {
    // Minimize the UI
    homeDiv.classList.remove('large');
    homeDiv.classList.add('small');
    mainContent.classList.add('hidden');
    toggleButton.innerHTML = '<i class="material-icons">add</i>'; // Icon for maximize
  }
}

function updateTheme() {
  const rootDiv = document.getElementById("rootDiv");
  const currentHour = new Date().getHours();

  if (currentHour >= 22 || currentHour < 7) {
    rootDiv.classList.remove("day-mode");
    rootDiv.classList.add("night-mode");
  } else {
    rootDiv.classList.remove("night-mode");
    rootDiv.classList.add("day-mode");
  }
}

window.onload = function () {
  updateTheme();

  // Optionally, keep updating every hour
  setInterval(updateTheme, 3600000); // 1 hour in milliseconds
};

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

scrollToBottom();
async function addButtons(message, sender = "user") {
  return new Promise(async (resolve) => {
    const messageRow = document.createElement("div");
    const buttonDiv = document.createElement("div");
    const uniqueId = `Button-btn-${Date.now()}`;
    buttonDiv.classList.add("btn");
    buttonDiv.id = uniqueId;
    messageRow.classList.add("chat-row", sender);
    message.forEach((msg) => {
      const button = document.createElement("button");
      const buttonText = msg?.title

      button.textContent = buttonText;
      // button.textContent = msg?.title;
      button.setAttribute("data-fulltext", buttonText);
      button.classList.add("chat-button", "truncate-button");
      button.onclick = () => handleButtonClick(msg,uniqueId);
      buttonDiv.appendChild(button);
    });
    messageRow.appendChild(buttonDiv);
    chatContainer.insertBefore(messageRow, chatContainer.firstChild);

    scrollToBottom();
    const buttons = buttonDiv.querySelectorAll(".truncate-button");
    buttons.forEach((button) => {
      if (button.scrollWidth > button.clientWidth) {

        button.setAttribute("title", button.textContent);
      }
    });
    setTimeout(() => {
      messageRow.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      messageRow.style.opacity = 1;
      messageRow.style.transform = "translateY(0)";
      setTimeout(() => {
        resolve();
      }, 500);
    }, 100);
  });
}

async function handleButtonClick(msg,uniqueId) {
  if (msg?.type === "WEB_URL") {
    window.open(msg?.url, "_blank");
  } else {
    sendMessageFunc(msg?.title);
    document.getElementById(uniqueId).style.display = "none";
    const payload = {
      userId: `user_${sessionId}`,
      companyId: companyId,
      projectId: projectId,
      sessionId: sessionId,
      content: msg?.payload,
      newChat: newChat
    };
    try {
      const response = await ApiCall(payload);
      if (response.error) {
        errorShowFun(response.error)
        throw new Error(response.error);
      }
      await handleMessageResponse(response?.data);
  
    } catch (error) {
      console.error("Error sending message:", error);
      errorShowFun(error)
    }
    newChat = false;
  }
}

