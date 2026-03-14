import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
//n vo esconder essa desgraça nao fodaseeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
const firebaseConfig = {
  apiKey: "AIzaSyC_FuLg1K7OizK5QzvBIWPw4z-VyBmTI-g",
  authDomain: "internet-do-saullo.firebaseapp.com",
  projectId: "internet-do-saullo",
  storageBucket: "internet-do-saullo.firebasestorage.app",
  messagingSenderId: "734964627186",
  appId: "1:734964627186:web:ddb0d715d493737db3026b"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messagesRef = collection(db, "guestbook");

const nameInput = document.getElementById("name");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send");
const wall = document.getElementById("wall");
const colorOptions = document.querySelectorAll(".color-postit");
const modalPostit = document.getElementById("modal-postit");

let selectedColor = "#fef68a";
let modalShown = false;

colorOptions.forEach(c => {
  c.addEventListener("click", () => {
    selectedColor = c.dataset.color;

    sendBtn.style.background = selectedColor;
    sendBtn.style.color = (selectedColor.toLowerCase() === "#222222") ? "#fff" : "#000";

    document.getElementById("postit-editor").style.background = selectedColor;
    document.getElementById("postit-editor").style.color = sendBtn.style.color;

    colorOptions.forEach(cc => cc.classList.remove("selected"));
    c.classList.add("selected");
  });
});

messageInput.addEventListener("input", () => {
  const words = messageInput.value.trim().split(/\s+/);
  if(words.length > 30) messageInput.value = words.slice(0,30).join(" ");
});
nameInput.addEventListener("input", () => {

  const max = 20;

  if(nameInput.value.length > max){
    nameInput.value = nameInput.value.slice(0, max);
  }

});
sendBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  let message = messageInput.value.trim();
  if(!name || !message) return;

  if(message.length > 200) message = message.slice(0,197) + "...";
  
  await addDoc(messagesRef, { name, message, color: selectedColor, time: Date.now() });

  nameInput.value = "";
  messageInput.value = "";

  sendBtn.style.background = selectedColor;
  sendBtn.style.color = (selectedColor.toLowerCase() === "#222222") ? "#fff" : "#000";

  const editor = document.getElementById("postit-editor");
  editor.style.background = selectedColor;
  editor.style.color = sendBtn.style.color;
  editor.style.border = `2px solid ${selectedColor}`;

  [nameInput, messageInput].forEach(input => {
    input.style.background = selectedColor;
    input.style.color = sendBtn.style.color;
    input.style.border = `2px solid ${selectedColor}`;
    input.style.setProperty('caret-color', sendBtn.style.color);
    input.setAttribute('placeholder', input.getAttribute('placeholder')); 
  });

  if(!modalShown){
    modalShown = true;
    const rect = sendBtn.getBoundingClientRect();
    modalPostit.style.top = `${rect.bottom + window.scrollY}px`;
    modalPostit.style.left = `${rect.left + window.scrollX}px`;
    modalPostit.style.display = "block";
    modalPostit.style.opacity = 1;
    modalPostit.style.transform = "translateY(0px) rotate(0deg)";
    modalPostit.querySelector(".pin").style.display = "block";

    setTimeout(() => {
      modalPostit.style.transform = "translateY(150px) rotate(15deg)";
      modalPostit.style.opacity = 0;
      modalPostit.querySelector(".pin").style.display = "none";
    }, 3000);

    setTimeout(() => modalPostit.style.display = "none", 5800);
  }
});

const q = query(messagesRef, orderBy("time","desc"));
onSnapshot(q, snapshot => {
  wall.innerHTML = "";
  let maxBottom = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const postit = document.createElement("div");
    postit.classList.add("postit");
    postit.style.background = data.color;
    postit.style.transform = `rotate(${Math.random()*20-10}deg)`;
    if(data.color.toLowerCase() === "#222222") postit.style.color = "#fff";

    const top = Math.random() * 60 + 10;
    const left = Math.random() * 60 + 10;
    postit.style.top = `${top}%`;
    postit.style.left = `${left}%`;

    postit.innerHTML = `
      <div class="pin"></div>
      <div class="content"><b>${data.name}</b><br>${data.message}</div>
    `;
    wall.appendChild(postit);

    const postitBottom = postit.offsetTop + postit.offsetHeight;
    if(postitBottom > maxBottom) maxBottom = postitBottom;

    // === drag ===
    let offsetX, offsetY, isDragging = false;
    const startDrag = (x, y) => { isDragging = true; offsetX = x - postit.offsetLeft; offsetY = y - postit.offsetTop; postit.style.zIndex = 1000; };
    const drag = (x, y) => { if(!isDragging) return; postit.style.left = `${x - offsetX}px`; postit.style.top = `${y - offsetY}px`; };
    const endDrag = () => { isDragging = false; postit.style.zIndex = ""; };

    postit.addEventListener("mousedown", e => startDrag(e.clientX, e.clientY));
    document.addEventListener("mousemove", e => drag(e.clientX, e.clientY));
    document.addEventListener("mouseup", endDrag);

    postit.addEventListener("touchstart", e => { e.preventDefault(); const t = e.touches[0]; startDrag(t.clientX, t.clientY); }, {passive:false});
    postit.addEventListener("touchmove", e => { e.preventDefault(); const t = e.touches[0]; drag(t.clientX, t.clientY); }, {passive:false});
    postit.addEventListener("touchend", endDrag);
  });

  wall.style.height = `${maxBottom + 50}px`;
});
colorOptions.forEach(c => {
  c.addEventListener("click", () => {
    selectedColor = c.dataset.color;

    const editor = document.getElementById("postit-editor");

    sendBtn.style.background = selectedColor;
    sendBtn.style.color = (selectedColor.toLowerCase() === "#222222") ? "#fff" : "#000";

    editor.style.background = selectedColor;
    editor.style.color = sendBtn.style.color;
    editor.style.border = `2px solid ${selectedColor}`;

    [nameInput, messageInput].forEach(input => {
      input.style.background = selectedColor;
      input.style.color = sendBtn.style.color;
      input.style.border = `2px solid ${selectedColor}`;
      sendBtn.style.border = `2px solid ${selectedColor}`;
      input.style.setProperty('caret-color', sendBtn.style.color); 
      input.setAttribute('placeholder', input.getAttribute('placeholder'));
    });

    colorOptions.forEach(cc => cc.classList.remove("selected"));
    c.classList.add("selected");
  });
});
window.addEventListener("DOMContentLoaded", () => {
  const editor = document.getElementById("postit-editor");
  const defaultColor = "#fef68a"; 

  selectedColor = defaultColor;

  sendBtn.style.background = selectedColor;
  sendBtn.style.color = "#000";

  editor.style.background = selectedColor;
  editor.style.color = "#000";
  editor.style.border = `2px solid ${selectedColor}`;

  [nameInput, messageInput].forEach(input => {
    input.style.background = selectedColor;
    input.style.color = "#000";
    input.style.border = `2px solid ${selectedColor}`;
    input.style.setProperty('caret-color', "#000");
  });
});

const menu = document.getElementById("postit-menu");

const menuCardsData = [
  {
    img: "bibima.jpg",
    class: "menu-white",
    link: "https://birene.lojavirtualnuvem.com.br"
  },
  {
    img: "joguinhos.png",
    class: "menu-black",
    link: "/joguinhos"
  },
  {
    img: "coup.png",
    class: "menu-white",
    link: "/coup"
  }
];

const menuCards = [];
let menuOpen = false;

menuCardsData.forEach(data => {

  const card = document.createElement("div");
  card.classList.add("menu-card", data.class);

  card.innerHTML = `
    <div class="pin"></div>
    <img src="${data.img}">
  `;

  card.style.display = "none";

  card.querySelector("img").onclick = () => {
    window.open(data.link, "_blank");
  };

  document.body.appendChild(card);
  menuCards.push(card);

});

menu.addEventListener("click", (e) => {

  e.stopPropagation();

  if(menuOpen){
    closeMenuCards();
    return;
  }

  const rect = menu.getBoundingClientRect();

  menuCards.forEach((card,i)=>{

    const offsetX = Math.random()*60 - 30;
    const offsetY = i*100 + (Math.random()*30-15);

    setTimeout(()=>{

      card.style.display = "block";

      card.style.top = `${rect.top + offsetY}px`;
      card.style.left = `${rect.right + 10 + offsetX}px`;

      card.style.opacity = 1;

      card.style.transform =
        `rotate(${Math.random()*20-10}deg)`;

    }, i*140);

  });

  menuOpen = true;

});

function closeMenuCards(){

  menuCards.forEach((card,i)=>{

    setTimeout(()=>{

      card.style.transform =
        `translateY(150px) rotate(${Math.random()*40-20}deg)`;

      card.style.opacity = 0;

    }, i*100);

    setTimeout(()=>{

      card.style.display = "none";
      card.style.opacity = 1;
      card.style.transform = "rotate(0deg)";

    }, 600 + i*100);

  });

  menuOpen = false;

}

document.addEventListener("click", (e)=>{

  if(menuOpen && !menu.contains(e.target)){
    closeMenuCards();
  }

});