function scrollToBottom() {
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
