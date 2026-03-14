import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js"
import {
    getFirestore,
    doc,
    setDoc,
    collection,
    getDoc,
    getDocs,
    updateDoc,
    onSnapshot,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"

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

const buttons = document.querySelectorAll(".game button");
const playerText = document.getElementById("player");
const botText = document.getElementById("bot");
const winnerText = document.getElementById("winner");
const scoreText = document.getElementById("score");
const streakText = document.getElementById("streak");
const extraText = document.getElementById("extra");
const roomInfo = document.getElementById("roomInfo");
const roomCodeInput = document.getElementById("roomCode");

const choices = ["pedra", "papel", "tesoura"];
const userNameInput = document.getElementById("userName");
let myName = "anon";
let playerScore = 0;
let enemyScore = 0;
let streak = 0;

let multiplayer = false;
let roomRef = null;
let playerId = null;
let currentRoomCode = null;

async function cleanRooms(){

const snap = await getDocs(collection(db,"rooms"));

snap.forEach(async (d)=>{

const data = d.data();

if(Date.now() - data.createdAt > 3600000){

await deleteDoc(doc(db,"rooms",d.id));

}

});

}
function randomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

document.getElementById("createRoom").onclick = async () => {
    await cleanRooms();
    const code = randomCode();
    currentRoomCode = code;
    roomRef = doc(db, "rooms", code);
    playerId = "p1";

    await setDoc(roomRef, {
        players: { 
            p1: userNameInput.value || "p1",
            p2: null,
            p3: null
        },
        choices: {},
        activeCount: 1,
        createdAt: Date.now()
    });
    roomInfo.textContent = "sala: " + code + " (Aguardando amigos...)";
    multiplayer = true;
    listen();
};

document.getElementById("joinRoom").onclick = async () => {
    const code = roomCodeInput.value.toUpperCase();
    if (!code) return alert("digite o código!");

    roomRef = doc(db, "rooms", code);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) return alert("sala não encontrada!");

    const data = snap.data();
    if (!data.players.p2) {
        playerId = "p2";
        await updateDoc(roomRef, { 
            "players.p2": userNameInput.value || "p2",
            activeCount: 2 
        });
    } else if (!data.players.p3) {
        playerId = "p3";
        await updateDoc(roomRef, { 
            "players.p3": userNameInput.value || "p3",
            activeCount: 3 
        });
    } else {
        return alert("sala cheia!");
    }

    currentRoomCode = code;
    roomInfo.textContent = "conectado na sala: " + code;
    multiplayer = true;
    listen();
};

function listen() {
    onSnapshot(roomRef, async (snap) => {
        const data = snap.data();
        if (!data) return;

        if (Date.now() - data.createdAt > 3600000) {
            await deleteDoc(roomRef);
            return;
        }
        const players = data.players || {};

        const myName = players[playerId] || "vc";

        const enemyNames = Object.entries(players)
            .filter(([id, name]) => id !== playerId && name)
            .map(([id, name]) => name);

        playerText.textContent = myName + ": -";
        botText.textContent = (enemyNames.join(", ") || "rival") + ": -";
        const c = data.choices || {};
        const totalPlayers = data.activeCount;

        if (Object.keys(c).length === totalPlayers && totalPlayers > 1) {
            resolveMultiplayer(c);
        } else {
            winnerText.textContent = `aguardando jogadas (${Object.keys(c).length}/${totalPlayers})`;
        }
    });
        
}

function resolveMultiplayer(choicesObj) {
    const myChoice = choicesObj[playerId];
    const allChoices = Object.values(choicesObj);
    const uniqueChoices = [...new Set(allChoices)];

    
    let result = "";

    if (uniqueChoices.length === 1 || uniqueChoices.length === 3) {
        result = "empate geral!";
    } else {
        const winMap = { pedra: "tesoura", tesoura: "papel", papel: "pedra" };
        const winChoice = uniqueChoices.find(a => uniqueChoices.some(b => winMap[a] === b));
        
        if (myChoice === winChoice) {
            result = "vc ganhou!";
            playerScore++;
            streak++;
        } else {
            result = "vc perdeu!";
            enemyScore++;
            streak = 0;
        }
    }

    winnerText.textContent = result;
    scoreText.textContent = `vc ${playerScore} x ${enemyScore} rivais`;
    streakText.textContent = `streak: ${streak}`;
    
    setTimeout(async () => {
        if (playerId === "p1") { 
            await updateDoc(roomRef, { choices: {} });
        }
    }, 2000);
}

buttons.forEach(btn => {
    btn.onclick = async () => {
        const playerChoice = btn.dataset.choice;
        playerText.textContent = "vc: " + playerChoice;

        if (multiplayer) {
            await updateDoc(roomRef, {
                [`choices.${playerId}`]: playerChoice
            });
            return;
        }

        // Modo Bot
        const botChoice = choices[Math.floor(Math.random() * 3)];
        botText.textContent = "bot: " + botChoice;

        if (playerChoice === botChoice) {
            winnerText.textContent = "empate!";
        } else if (
            (playerChoice === "pedra" && botChoice === "tesoura") ||
            (playerChoice === "papel" && botChoice === "pedra") ||
            (playerChoice === "tesoura" && botChoice === "papel")
        ) {
            winnerText.textContent = "vc ganhou!";
            playerScore++;
            streak++;
        } else {
            winnerText.textContent = "vc perdeu!";
            enemyScore++;
            streak = 0;
        }

        scoreText.textContent = `vc ${playerScore} x ${enemyScore} bot`;
        streakText.textContent = `streak: ${streak}`;
        checkCheat();
    };
});

function checkCheat() {
    if (streak >= 10) {
        extraText.textContent = "calma aí... 10 seguidas? hack detectado!";
    } else {
        extraText.textContent = "";
    }
}
window.addEventListener('beforeunload', () => {
    if (multiplayer && playerId === "p1") {
        deleteDoc(roomRef); 
    }
});