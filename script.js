const canvas = document.getElementById('canvas1')
const ctx = canvas.getContext('2d')
const collisionCanvas = document.getElementById('collisionCanvas')
const collisionCtx = collisionCanvas.getContext('2d')

let score = 0
ctx.font = '50px impact'

canvas.width = 1600;
canvas.height = 800;
const baseHeight = 800;

const img = new Image();
img.src = './sniper scope.png'

let width;
let height;
let ratio;

let timeToNextRaven = 0
let ravenInterval = 500
let lastTime = 0
let ravens = [];
let gameOver = false

function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    collisionCanvas.width = window.innerWidth;
    collisionCanvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
    ratio = height / baseHeight;
    ravens.forEach(raven => {
        raven.resize();
    });
    cursorWidth = baseCursorWidth * ratio
    cursorHeight = baseCursorHeight * ratio;
}

window.addEventListener('resize', setCanvasSize);

let mouseX = 0
let mouseY = 0
const baseCursorWidth = 100
const baseCursorHeight = 100

let cursorWidth = baseCursorWidth
let cursorHeight = baseCursorHeight;

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX - canvas.offsetLeft;
    mouseY = e.clientY - canvas.offsetTop;
});

setCanvasSize();

class Raven {
    constructor() {
        this.spriteWidth = 271
        this.spriteHeight = 194
        this.sizeModifier = Math.random() * 0.6 + 0.4
        this.width = this.spriteWidth * this.sizeModifier
        this.height = this.spriteHeight * this.sizeModifier
        this.x = canvas.width
        this.y = Math.random() * (canvas.height - this.height)
        this.directionX = Math.random() * 5 + 3
        this.directionY = Math.random() * 5 - 2.5
        this.markedForDeletion = false
        this.image = new Image()
        this.image.src = 'raven.png'
        this.frame = 0
        this.maxFrame = 4
        this.timeSinceFlap = 0
        this.flapInterval = Math.random() * 50 + 50
        this.randomColors = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)]
        this.color = 'rgb(' + this.randomColors[0] + ',' + this.randomColors[1] + ',' + this.randomColors[2] + ')'
        this.hasTrail = Math.random() > 0.5
    }

    update(deltaTime) {
        if (this.y < 0 || this.y > canvas.height - this.height) {
            this.directionY = this.directionY * -1
        }
        this.x -= this.directionX
        this.y += this.directionY
        if (this.x < 0 - this.width) this.markedForDeletion = true

        this.timeSinceFlap += deltaTime
        if (this.timeSinceFlap > this.flapInterval) {
            if (this.frame > this.maxFrame) this.frame = 0
            else this.frame++
            this.timeSinceFlap = 0
            if (this.hasTrail) {
                for (let i = 0; i < 5; i++)
                    particles.push(new Particle(this.x, this.y, this.width, this.color))
            }
        }
        if (this.x < 0 - this.width) gameOver = true
    }
    draw() {
        collisionCtx.fillStyle = this.color
        collisionCtx.fillRect(this.x, this.y, this.width, this.height)
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height)
    }
    resize() {
        this.width = this.spriteWidth * this.sizeModifier * ratio;
        this.height = this.spriteHeight * this.sizeModifier * ratio;
    }
}

let particles = []
class Particle {
    constructor(x, y, size, color) {
        this.size = size
        this.x = x + this.size / 2 + Math.random() * 50 - 25
        this.y = y + this.size / 3 + Math.random() * 50 - 25
        this.radius = Math.random() * this.size / 10
        this.MaxRadius = Math.random() * 20 + 35
        this.speedX = Math.random() * 1 + 0.5
        this.color = color
    }
    update() {
        this.x += this.speedX
        this.radius += 0.5
        if (this.radius > this.MaxRadius - 5) this.markedForDeletion = true
    }
    draw() {
        ctx.save()
        ctx.globalAlpha = 1 - this.radius / this.MaxRadius
        ctx.beginPath()
        ctx.fillStyle = this.color
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    }
}

let explosions = []
class Explosion {
    constructor(x, y, size) {
        this.image = new Image()
        this.image.src = 'boom.png'
        this.spriteWidth = 200
        this.spriteHeight = 179
        this.size = size
        this.x = x
        this.y = y
        this.frame = 0
        this.sound = new Audio()
        this.sound.src = 'boom.wav'
        this.sound.volume = 0.01;
        this.timeSinceLastFrame = 0
        this.frameInterval = 200
        this.markedForDeletion = false
    }
    update(deltaTime) {
        if (this.frame === 0) this.sound.play()
        this.timeSinceLastFrame += deltaTime
        if (this.timeSinceLastFrame += deltaTime) {
            this.frame++
            this.timeSinceLastFrame = 0
            if (this.frame > 5) this.markedForDeletion = true
        }
    }
    draw() {
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y - this.size / 4, this.size, this.size)
    }
}

function drawScore() {
    ctx.fillStyle = 'black'
    ctx.fillText('Score: ' + score, 50, 75)
    ctx.fillStyle = 'white'
    ctx.fillText('Score: ' + score, 55, 80)
}

function drawGameOver() {
    ctx.fillStyle = 'black'
    ctx.fillText('GAME OVER, your score is ' + score, canvas.width / 2, canvas.height / 2)
    ctx.fillStyle = 'white'
    ctx.fillText('GAME OVER, your score is ' + score, canvas.width / 2 + 5, canvas.height / 2 + 5)
}

window.addEventListener('click', function (e) {
    const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1)
    const pc = detectPixelColor.data
    ravens.forEach(object => {
        if (object.randomColors[0] === pc[0] && object.randomColors[1] === pc[1] && object.randomColors[2] === pc[2]) {
            // collision detected
            object.markedForDeletion = true
            score++
            explosions.push(new Explosion(object.x, object.y, object.width))
        }
    })
})

function animate(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, mouseX - cursorWidth / 2, mouseY - cursorHeight / 2, cursorWidth, cursorHeight)
    collisionCtx.clearRect(0, 0, canvas.width, canvas.height)
    let deltaTime = timestamp - lastTime
    lastTime = timestamp
    timeToNextRaven += deltaTime
    if (timeToNextRaven > ravenInterval) {
        ravens.push(new Raven());
        timeToNextRaven = 0
        ravens.sort(function (a, b) {
            return a.width - b.width
        })
    }
    drawScore();
    [...particles, ...ravens, ...explosions].forEach(raven => raven.update(deltaTime));
    [...particles, ...ravens, ...explosions].forEach(raven => raven.draw());
    ravens = ravens.filter(object => !object.markedForDeletion)
    explosions = explosions.filter(object => !object.markedForDeletion)
    particles = particles.filter(object => !object.markedForDeletion)

    if (!gameOver) requestAnimationFrame(animate)
    else {
        drawGameOver()
        canvas.style.cursor = 'auto'
    }
}
animate(0)
