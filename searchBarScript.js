var virtuallyhuman = null;
var needMicAccess = false;
var host = window.location.hostname;
// const avatarId = getParameter('avatarId');
//834286566626447339
const avatarId = "834286566626447339";
const connect = getBooleanParameter("connect");
let sessionId;
let mobileView = false;
let newChat = true;
let companyId = "10";
let projectId = "9";
// id of video element to display avatar
let isEventListenerAdded1 = false;
let isEventListenerAdded2 = false;

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
      if(mobileView){
        let afterSection = document.getElementById("after-section");
        afterSection.style.display = "flex"; // Make the after-section visible
        
        // Optionally, you can add a fade-in effect
        afterSection.style.opacity = "1";

      }
     
    } else {
      console.log("Desktop View");
     
       document.getElementById("body").style.overflow = "overlay"
    }
  }

  detectView(); 
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
    '<i class="material-icons"style="color: #6699ff;">volume_off</i>';

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
      '<i class="material-icons" style="color: #6699ff;">mic_off</i>';
      if (!bumpEffectTriggered) {
        initBumpingEffect();
        console.log("enterrr");
        
        bumpEffectTriggered = true; // Set flag to true after calling the effect
      }
  }
}

function mediaConnectHandler() {
  console.log("In mediaConnectHandler");
  virtuallyhuman.setMicEnabled(false);
  virtuallyhuman.setSpeakerEnabled(true);
  initBumpingEffect();
  document.getElementById("micButton").disabled = false;
  document.getElementById("speakerButton").disabled = false;
}

function mediaDisconnectHandler() {
  console.log("In mediaDisconnectHandler");
  
  document.getElementById("disconnect").disabled = true;
 
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
        if (response.error) {
          errorShowFun(response.error)
          throw new Error(response.error);
        }
        await handleMessageResponse(response?.data);
    
      } catch (error) {
        console.error("Error sending message:", error);
        errorShowFun(error)
      }
    }
  }
}
function websocketConnectHandler(resp) {
  sessionId = resp.sessionId;
}
  // Set up the receive-message event listener
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
    errorMsgElement.innerText = errorMessage;
   
    setTimeout(() => {
      errorMsgElement.style.visibility = "hidden";
    }, 5000);
  }
// Auto connect if asked so.
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
async function startCall() {
  document.getElementById("textBox").disabled = false

  // Clear exsiting object.
  if (virtuallyhuman) {
    virtuallyhuman = null;
  }

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

  // Trigger auth.
  virtuallyhuman.authenticate();

  document.getElementById("disconnect").disabled = false;
 
  document.getElementById("disconnect").style.cursor = "pointer";
  document.getElementById("submitButton").style.cursor = "pointer";
  document.getElementById("micButton").style.cursor = "pointer";
  document.getElementById("speakerButton").style.cursor = "pointer";
}

function endCall(reason) {
  document.getElementById("textBox").disabled = true
  document.getElementById("body").style.overflow = "overlay"
  buttonClickFeedback("disconnect")
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
    document.getElementById("progress").innerHTML = "Progress: 0%";
   
    document.getElementById("disconnect").style.cursor = "default";

    document.getElementById("micButton").style.cursor = "default";
    document.getElementById("speakerButton").style.cursor = "default";
    document.getElementById(videoElements.remoteVideo).srcObject = null;
    document.getElementById("chat-container").innerHTML = '';
    showBefore();
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
  if (permissionGranted && !needMicAccess) {
    virtuallyhuman.toggleMic();
  } else {
    showMicPermissionsErrorDialog();
  }
}

function toggleSpeaker() {
  virtuallyhuman.toggleSpeaker();
  buttonClickFeedback("speakerButton");
}

const beforeSectionHandleKeyPress = async () => {
  mobileView = true;
  const textBox = document.getElementById("beforeSectiontextBox");
  if (!isEventListenerAdded1) {
    textBox.addEventListener("keydown", async (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        var msg = textBox.value.trim();
        const isMobileView = window.innerWidth <= 768;

      if (isMobileView) {
        let afterSection = document.getElementById("after-section");
        afterSection.style.display = "flex"; // Make the after-section visible
        
        // Optionally, you can add a fade-in effect
        afterSection.style.opacity = "1";
        document.getElementById("body").style.height = "100%";
        document.getElementById("body").style.overflow = "hidden"
      }
        
        if (msg === "") {
          event.preventDefault();
          return;
        }
        try {
          await startCall();
          await showAfter();
          await sendMessageFunc(msg);
          console.log(msg);
          textBox.value = "";
          setTimeout(async () => {
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
          }, 4000);
          
        } catch (error) {
          console.error("ERROR=>",error)
        }
       
        event.preventDefault(); 
      }
    });
    isEventListenerAdded1 = true;
  }
};

async function beforeSectionSendText() {
  mobileView = true;
  var msg = document.getElementById("beforeSectiontextBox").value;
  const isMobileView = window.innerWidth <= 768;

  if (isMobileView) {
    let afterSection = document.getElementById("after-section");
    afterSection.style.display = "flex"; // Make the after-section visible
    
    // Optionally, you can add a fade-in effect
    afterSection.style.opacity = "1";
       document.getElementById("body").style.height = "100%";
        document.getElementById("body").style.overflow = "hidden"
  }
 
  if(msg===""){
    return
  }  
  document.getElementById("beforeSectiontextBox").value = "";
  try {
    await startCall();
    await showAfter();
    await sendMessageFunc(msg);
    setTimeout(async () => {
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
    }, 4000);
    
  } catch (error) {
    console.error("ERROR=>",error)
  }
}

const handleKeyPress = async () => {
  const textBox = document.getElementById("textBox");
  if (!isEventListenerAdded2) {
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
        event.preventDefault();// Prevents the default new line behavior
      }
    });
    isEventListenerAdded2 = true;
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
    
   
    messageRow.style.opacity = 0; 
    messageRow.style.transform = "translateY(20px)"; 

    const balloon = document.createElement("div");
    balloon.classList.add("chat-balloon");
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

async function sendMessageFunc(message) {
  const input = document.querySelector("textarea");
  if (message.trim() !== "") {
    addMessage(message, "user");
    input.value = "";
  }
}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function showAfter() {

  document.getElementById('before-section').style.display = 'none';
 
  document.getElementById('after-section').style.display = 'flex';
}

async function showBefore() {
  
  document.getElementById('before-section').style.display = 'flex';
 
  document.getElementById('after-section').style.display = 'none';
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
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

scrollToBottom();

async function addImageContainer(imageUrl, sender = "user") {
  const messageRow = document.createElement("div");
  messageRow.classList.add("chat-row", sender);

  const balloon = document.createElement("div");
  balloon.classList.add("imageContainer", sender);

  const anchor = document.createElement("a");
  anchor.href = imageUrl;
  anchor.target = "_blank";

  const img = document.createElement("img");
  img.src = imageUrl;
  img.allow = "picture-in-picture";
  img.allowFullscreen = true;

  anchor.appendChild(img);
  balloon.appendChild(anchor);

  messageRow.appendChild(balloon);
  chatContainer.insertBefore(messageRow, chatContainer.firstChild);

  scrollToBottom();
}


function addMessageFunc(message, sender = "user") {
  return new Promise(async (resolve) => {
 if (typeof message !== "string" || message.trim() === "") {
      resolve(); // Skip adding the bubble if message is invalid or empty
      return;
    }
    const messageRow = document.createElement("div");
    messageRow.classList.add("chat-row", sender);
    
   
    messageRow.style.opacity = 0; 
    messageRow.style.transform = "translateY(20px)"; 

    const balloon = document.createElement("div");
    balloon.classList.add("chat-balloon");
    const messageSpan = document.createElement("span");
    messageSpan.innerHTML = message;
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
}function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

scrollToBottom();
async function addQuickReply(message, sender = "user") {
  return new Promise(async (resolve) => {
    const messageRow = document.createElement("div");
    const quickReplyDiv = document.createElement("div");
    const uniqueId = `quickReply-btn-${Date.now()}`;
    quickReplyDiv.classList.add("btn");
    quickReplyDiv.id = uniqueId;
    messageRow.classList.add("chat-row", sender);
    message.forEach((msg) => {
      const button = document.createElement("button");
      const buttonText = msg?.title

      button.textContent = buttonText;
      // button.textContent = msg?.title;
      button.setAttribute("data-fulltext", buttonText);
      button.classList.add("chat-button", "truncate-button");
      button.onclick = () => handleQuickButtonClick(msg,uniqueId);
      quickReplyDiv.appendChild(button);
    });
    messageRow.appendChild(quickReplyDiv);
    chatContainer.insertBefore(messageRow, chatContainer.firstChild);

    scrollToBottom();
    const buttons = quickReplyDiv.querySelectorAll(".truncate-button");

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

async function handleQuickButtonClick(msg,uniqueId) {
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
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

scrollToBottom();

async function addVideoContainer(
  videoLink,
  sender = "user"
) {
  const messageRow = document.createElement("div");
  messageRow.classList.add("chat-row", sender);

  const balloon = document.createElement("div");

  balloon.classList.add("videoContainer", sender);


  let embedLink;
  const youtubeMatch = videoLink.match(
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/
  );
  if (youtubeMatch) {
    embedLink = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  } else {
    embedLink = videoLink;
  }

  const anchor = document.createElement("a");
  anchor.href = videoLink;
  anchor.target = "_blank";

  const iframe = document.createElement("iframe");
  iframe.src = embedLink;
  iframe.allow = "encrypted-media; picture-in-picture";
  iframe.allowFullscreen = true;

  anchor.appendChild(iframe);
  balloon.appendChild(anchor);

  messageRow.appendChild(balloon);

  chatContainer.insertBefore(messageRow, chatContainer.firstChild);

  scrollToBottom();
}
