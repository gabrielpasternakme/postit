const canvas = document.getElementById("maze")
const ctx = canvas.getContext("2d")

const cols = 21
const rows = 21
const size = canvas.width / cols
let startTime = 0
let timerInterval
let grid = []
let stack = []

let player = {x:0,y:0}
let goal = {x:cols-1,y:rows-1}

class Cell{

constructor(x,y){

this.x=x
this.y=y

this.walls={
top:true,
right:true,
bottom:true,
left:true
}

this.visited=false

}

draw(){

const x = this.x*size
const y = this.y*size

ctx.strokeStyle="white"
ctx.lineWidth=2

if(this.walls.top){
ctx.beginPath()
ctx.moveTo(x,y)
ctx.lineTo(x+size,y)
ctx.stroke()
}

if(this.walls.right){
ctx.beginPath()
ctx.moveTo(x+size,y)
ctx.lineTo(x+size,y+size)
ctx.stroke()
}

if(this.walls.bottom){
ctx.beginPath()
ctx.moveTo(x+size,y+size)
ctx.lineTo(x,y+size)
ctx.stroke()
}

if(this.walls.left){
ctx.beginPath()
ctx.moveTo(x,y+size)
ctx.lineTo(x,y)
ctx.stroke()
}

}

}

function index(x,y){

if(x<0||y<0||x>=cols||y>=rows) return -1

return x + y*cols

}



function generateGrid(){

grid=[]

for(let y=0;y<rows;y++){
for(let x=0;x<cols;x++){

grid.push(new Cell(x,y))

}
}

}

function getNeighbors(cell){

const neighbors=[]

const top = grid[index(cell.x,cell.y-1)]
const right = grid[index(cell.x+1,cell.y)]
const bottom = grid[index(cell.x,cell.y+1)]
const left = grid[index(cell.x-1,cell.y)]

if(top && !top.visited) neighbors.push(top)
if(right && !right.visited) neighbors.push(right)
if(bottom && !bottom.visited) neighbors.push(bottom)
if(left && !left.visited) neighbors.push(left)

return neighbors

}

function removeWalls(a,b){

const dx = a.x-b.x
const dy = a.y-b.y

if(dx===1){
a.walls.left=false
b.walls.right=false
}
else if(dx===-1){
a.walls.right=false
b.walls.left=false
}

if(dy===1){
a.walls.top=false
b.walls.bottom=false
}
else if(dy===-1){
a.walls.bottom=false
b.walls.top=false
}

}

function generateMaze(){

generateGrid()

let current = grid[0]

stack=[]
player={x:0,y:0}

while(true){

current.visited=true

const neighbors = getNeighbors(current)

if(neighbors.length>0){

const next = neighbors[Math.floor(Math.random()*neighbors.length)]

stack.push(current)

removeWalls(current,next)

current=next

}
else if(stack.length>0){

current=stack.pop()

}
else{

break

}

}
startTimer()
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    grid.forEach(c => c.draw());

    // Objetivo (Brilho Verde)
    ctx.fillStyle = "#00ff00";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ff00";
    ctx.fillRect(goal.x * size + size * 0.25, goal.y * size + size * 0.25, size * 0.5, size * 0.5);

    ctx.fillStyle = "#00ffff";
    ctx.shadowColor = "#00ffff";
    ctx.beginPath();
    ctx.arc(
        player.x * size + size / 2,
        player.y * size + size / 2,
        size / 3.5,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
}

function move(dir){

const cell = grid[index(player.x,player.y)]

if(dir==="up" && !cell.walls.top) player.y--
if(dir==="down" && !cell.walls.bottom) player.y++
if(dir==="left" && !cell.walls.left) player.x--
if(dir==="right" && !cell.walls.right) player.x++

if(player.x===goal.x && player.y===goal.y){

stopTimer()

document.getElementById("status").textContent =
"vc venceu!!!!" + " novo labirinto em 10s"

setTimeout(()=>{

generateMaze()
draw()
document.getElementById("status").textContent="chegue no verde"

},10000)

}

draw()

}

document.addEventListener("keydown", (e) => {
    const keysToBlock = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
    if (keysToBlock.includes(e.key)) {
        e.preventDefault(); 
    }

    const key = e.key.toLowerCase();
    if (key === "w" || e.key === "ArrowUp") move("up");
    if (key === "s" || e.key === "ArrowDown") move("down");
    if (key === "a" || e.key === "ArrowLeft") move("left");
    if (key === "d" || e.key === "ArrowRight") move("right");
});
function startTimer(){

clearInterval(timerInterval)

startTime = Date.now()

timerInterval = setInterval(()=>{

const t = (Date.now() - startTime) / 1000

document.getElementById("timer").textContent =
"tempo: " + t.toFixed(2) + "s"

},50)

}

function stopTimer(){

clearInterval(timerInterval)

finalTime = ((Date.now() - startTime) / 1000).toFixed(2)

}
generateMaze()
draw()