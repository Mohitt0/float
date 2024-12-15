function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

scrollToBottom();

async function addImageContainer(imageUrl, sender = "user") {
  const messageRow = document.createElement("div");
  messageRow.classList.add("chat-row", sender);

  const balloon = document.createElement("div");
  balloon.classList.add("imageContainer", sender);

  const img = document.createElement("img");
  img.src = imageUrl;
  img.classList.add("chat-image");
  img.onclick = () => openImageModal(imageUrl); // Add click event to open modal

  balloon.appendChild(img);
  messageRow.appendChild(balloon);
  chatContainer.insertBefore(messageRow, chatContainer.firstChild);

  scrollToBottom();
}
function openImageModal(imageUrl) {
  const modal = document.getElementById("imageModal");
  const modalImage = document.getElementById("modalImage");

  modalImage.src = imageUrl; // Set the image source
  modal.style.display = "flex"; // Show the modal
}

function closeImageModal() {
  const modal = document.getElementById("imageModal");
  modal.style.display = "none"; // Hide the modal
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
}