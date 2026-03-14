function getDailyNumber() {
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 100) + 1;
}

const secret = getDailyNumber();
const todayKey = new Date().toLocaleDateString('pt-BR');
let tries = 0;

const guessInput = document.getElementById("guess");
const hintText = document.getElementById("hint");
const triesText = document.getElementById("tries");
const checkBtn = document.getElementById("check");
const historyDiv = document.getElementById("historyList");

let gameHistory = JSON.parse(localStorage.getItem("guessHistory")) || {};

function checkDailyStatus() {
    if (gameHistory[todayKey]) {
        const result = gameHistory[todayKey];
        hintText.textContent = `você já acertou hoje em ${result} tentativas!`;
        hintText.style.color = "#00ff9d";
        checkBtn.disabled = true;
        checkBtn.textContent = "concluído";
        guessInput.disabled = true;
    }
}

function updateHistoryUI() {
    historyDiv.innerHTML = "";
    const dates = Object.keys(gameHistory).reverse().slice(0, 7);
    
    if (dates.length === 0) {
        historyDiv.innerHTML = "<p style='font-size:0.8rem; opacity:0.5'>nenhum jogo ainda...</p>";
        return;
    }

    dates.forEach(date => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `<span>${date}</span> <b>${gameHistory[date]} tnt.</b>`;
        historyDiv.appendChild(item);
    });
}

checkBtn.onclick = () => {
    const guess = Number(guessInput.value);
    if (!guess || guess < 1 || guess > 100) return;

    tries++;
    if (guess === secret) {
        hintText.textContent = "✨ ACERTOU! ✨";
        gameHistory[todayKey] = tries;
        localStorage.setItem("guessHistory", JSON.stringify(gameHistory));
        checkDailyStatus();
        updateHistoryUI();
    } else {
        hintText.textContent = guess < secret ? "↑ mais alto..." : "↓ mais baixo...";
    }
    triesText.textContent = "tentativas: " + tries;
    guessInput.value = "";
    guessInput.focus();
};

document.getElementById("toggleHistory").onclick = () => {
    const menu = document.getElementById("historyMenu");
    menu.classList.toggle("open");
};

checkDailyStatus();
updateHistoryUI();
