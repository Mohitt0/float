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
