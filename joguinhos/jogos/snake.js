import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js"
import { deleteDoc, doc, getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"

const firebaseConfig = {
    apiKey: "AIzaSyC_FuLg1K7OizK5QzvBIWPw4z-VyBmTI-g",
    authDomain: "internet-do-saullo.firebaseapp.com",
    projectId: "internet-do-saullo"
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const startModal = document.getElementById("startModal");
const gameOverModal = document.getElementById("gameOver");
const playerNameInput = document.getElementById("playerName");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIN_SCORE = 50; 
const grid = 20;
let mode = "competicao"; 
let score1 = 0;
let score2 = 0;
let count = 0;
let speed = 6; 
let multiplayer = false;
let gameActive = false; 

let snake1 = { x: 160, y: 160, dx: grid, dy: 0, cells: [], maxCells: 4, color: "yellow" };
let snake2 = { x: 240, y: 240, dx: -grid, dy: 0, cells: [], maxCells: 4, color: "blue" };
let apple = { x: 320, y: 320 };

function rand(min, max) { return Math.floor(Math.random() * (max - min)) + min; }

async function cleanLeaderboard(){

const q = query(
collection(db,"snakeScores"),
orderBy("score","desc")
);

const snap = await getDocs(q);

snap.docs.forEach(async (d,index)=>{

if(index >= 10){
await deleteDoc(doc(db,"snakeScores",d.id));
}

});

}
async function saveScore(name, val) {
    if (val === 0 || multiplayer) return; 

    try {
        const q = query(collection(db, "snakeScores"), orderBy("score", "desc"), limit(10));
        const snap = await getDocs(q);
        
        let podeEntrar = false;
        if (snap.size < 10) {
            podeEntrar = true; 
        } else {
            const ultimoSet = snap.docs[snap.docs.length - 1].data().score;
            if (val > ultimoSet) podeEntrar = true; 
        }

        if (podeEntrar) {
            await addDoc(collection(db, "snakeScores"), {
                name: name,
                score: val,
                date: Date.now()
            });
            await cleanLeaderboard();
            loadLeaderboard();
        }
    } catch (e) { console.error("Erro ao processar ranking:", e); }
}
async function loadLeaderboard() {
    const q = query(collection(db, "snakeScores"), orderBy("score", "desc"), limit(10));
    const snap = await getDocs(q);
    const list = document.getElementById("leaderboard");
    list.innerHTML = "";
    
    let i = 1;
    snap.forEach(doc => {
        const li = document.createElement("li");
        li.textContent = `${i}º ${doc.data().name} — ${doc.data().score}`;
        list.appendChild(li);
        i++;
    });
}


function iniciarJogo() {
    startModal.style.display = "none";
    gameActive = true;
    reset();
    requestAnimationFrame(loop);
}

document.getElementById("btnSolo").onclick = () => { multiplayer = false; iniciarJogo(); };
document.getElementById("btnComp").onclick = () => { multiplayer = true; mode = "competicao"; iniciarJogo(); };
document.getElementById("btnBattle").onclick = () => { multiplayer = true; mode = "batalha"; iniciarJogo(); };

document.getElementById("btnRestart").onclick = async () => {
    const nome = playerNameInput.value || "Anônimo";
    const maiorScore = Math.max(score1, score2);
    await saveScore(nome, maiorScore);
    location.reload();
};


function loop() {
    if (!gameActive) return;

    requestAnimationFrame(loop);

    if (++count < speed) return;
    count = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    moveSnake(snake1);
    if (multiplayer) moveSnake(snake2);
    if (multiplayer && mode === "batalha") checkSnakeCollision();

    drawApple();
    drawSnake(snake1);
    if (multiplayer) drawSnake(snake2);
}

function moveSnake(snake) {
    snake.x += snake.dx;
    snake.y += snake.dy;

    if (snake.x < 0) snake.x = canvas.width - grid;
    else if (snake.x >= canvas.width) snake.x = 0;
    if (snake.y < 0) snake.y = canvas.height - grid;
    else if (snake.y >= canvas.height) snake.y = 0;

    snake.cells.unshift({ x: snake.x, y: snake.y });
    if (snake.cells.length > snake.maxCells) snake.cells.pop();

    if (snake.x === apple.x && snake.y === apple.y) {
        snake.maxCells++;
        if (snake === snake1) score1++; else score2++;
        updateScore();

        if (multiplayer) {
            if (score1 >= WIN_SCORE) endGame("Player 1");
            if (score2 >= WIN_SCORE) endGame("Player 2");
        }
        generateApple(); 
    }

    snake.cells.forEach((cell, index) => {
        for (let i = index + 1; i < snake.cells.length; i++) {
            if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
                if (mode === "competicao" || !multiplayer) {
                
                    endGame(multiplayer ? (snake === snake1 ? "Player 2" : "Player 1") : "Você");
                } else {
                    resetSnake(snake);
                    if (snake === snake1) score1 = 0; else score2 = 0;
                    updateScore();
                }
            }
        }
    });
}

function checkSnakeCollision() {
    snake2.cells.forEach(cell => {
        if (snake1.x === cell.x && snake1.y === cell.y) {
            score2 += snake1.maxCells; snake2.maxCells += snake1.maxCells;
            resetSnake(snake1); score1 = 0; updateScore();
            if (score2 >= WIN_SCORE) endGame("Player 2");
            flashEffect();
        }
    });
    snake1.cells.forEach(cell => {
        if (snake2.x === cell.x && snake2.y === cell.y) {
            score1 += snake2.maxCells; snake1.maxCells += snake2.maxCells;
            resetSnake(snake2); score2 = 0; updateScore();
            if (score1 >= WIN_SCORE) endGame("Player 1");
            flashEffect();
        }
    });
}

function flashEffect() {
    canvas.style.borderColor = "#fff";
    setTimeout(() => { canvas.style.borderColor = "#333"; }, 200);
}

function generateApple() {
    let newX, newY, overlapping = true;
    while (overlapping) {
        newX = rand(0, 20) * grid;
        newY = rand(0, 20) * grid;
        overlapping = false;

        snake1.cells.forEach(cell => { if (cell.x === newX && cell.y === newY) overlapping = true; });

        if (multiplayer) {
            snake2.cells.forEach(cell => { if (cell.x === newX && cell.y === newY) overlapping = true; });
        }
    }
    apple.x = newX; apple.y = newY;
}

function endGame(winner) {
    gameActive = false;
    gameOverModal.style.display = "block";
    const msg = document.getElementById("winnerMsg");
    const final = document.getElementById("finalScore");
    
    if (multiplayer) {
        playerNameInput.style.display = "none";
        msg.textContent = winner + " Venceu!";
        final.textContent = `P1: ${score1} | P2: ${score2}`;
    } else {
        playerNameInput.style.display = "block";
        msg.textContent = "Game Over!";
        final.textContent = `Seu score: ${score1}`;
    }
}

function updateScore() {
    const display = document.getElementById("score");
    if (!multiplayer) {
        display.textContent = "score: " + score1;
    } else {
        display.textContent = `p1: ${score1} 🍎 | p2: ${score2} 🍎`;
    }
}

function drawSnake(snake) {
    ctx.fillStyle = snake.color;
    snake.cells.forEach(cell => ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1));
}

function drawApple() {
    ctx.fillStyle = "#ff0044";
    ctx.fillRect(apple.x, apple.y, grid - 1, grid - 1);
}

function resetSnake(snake) {
    snake.x = rand(0, 20) * grid;
    snake.y = rand(0, 20) * grid;
    snake.cells = [];
    snake.maxCells = 4;
    snake.dx = (snake === snake1) ? grid : -grid;
    snake.dy = 0;
}

function reset() {
    resetSnake(snake1);
    if (multiplayer) resetSnake(snake2);
    score1 = 0;
    score2 = 0;
    updateScore();
    generateApple();
}


document.addEventListener("keydown", e => {

    const keysToBlock = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];

    if (keysToBlock.includes(e.key)) {
        e.preventDefault(); 
    }

    const key = e.key.toLowerCase();

    if (key === "a" && snake1.dx === 0) { snake1.dx = -grid; snake1.dy = 0; }
    if (key === "d" && snake1.dx === 0) { snake1.dx = grid; snake1.dy = 0; }
    if (key === "w" && snake1.dy === 0) { snake1.dy = -grid; snake1.dx = 0; }
    if (key === "s" && snake1.dy === 0) { snake1.dy = grid; snake1.dx = 0; }

    if (multiplayer) {
        if (e.key === "ArrowLeft" && snake2.dx === 0) { snake2.dx = -grid; snake2.dy = 0; }
        if (e.key === "ArrowRight" && snake2.dx === 0) { snake2.dx = grid; snake2.dy = 0; }
        if (e.key === "ArrowUp" && snake2.dy === 0) { snake2.dy = -grid; snake2.dx = 0; }
        if (e.key === "ArrowDown" && snake2.dy === 0) { snake2.dy = grid; snake2.dx = 0; }
    }
});

if ('ontouchstart' in window) {
    document.querySelector(".controls").style.display = "block";
}

document.getElementById("up").onclick = () => { if(snake1.dy === 0) { snake1.dy = -grid; snake1.dx = 0; } };
document.getElementById("down").onclick = () => { if(snake1.dy === 0) { snake1.dy = grid; snake1.dx = 0; } };
document.getElementById("left").onclick = () => { if(snake1.dx === 0) { snake1.dx = -grid; snake1.dy = 0; } };
document.getElementById("right").onclick = () => { if(snake1.dx === 0) { snake1.dx = grid; snake1.dy = 0; } };

loadLeaderboard();