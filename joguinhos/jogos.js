const flashlight = document.getElementById('flashlight');
const body = document.body;

document.addEventListener('mousemove', (e) => {
    if (!body.classList.contains('dark-mode')) return;

    flashlight.style.setProperty('--x', e.clientX + 'px');
    flashlight.style.setProperty('--y', e.clientY + 'px');
});
function toggleDarkness() {
    document.body.classList.toggle('dark-mode');
    
    console.log("Luzes apagadas:", document.body.classList.contains('dark-mode'));

    const audio = new Audio('https://www.soundjay.com/buttons_c2026/sounds/button-50.mp3');
    audio.volume = 0.2;
    audio.play();
}