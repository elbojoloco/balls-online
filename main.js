import { socket } from './socket'

const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

const prediction = true

let player = null
let players = []

socket.listen('init', data => {
  // console.log(data)

  player = data.player

  console.log(player)
})

socket.listen('tick', data => {
  // console.log(JSON.stringify(data, null, 4))

  const ps = data.players

  player.position.x = ps[player.id].position.x
  player.position.y = ps[player.id].position.y

  delete ps[player.id]

  players = Object.values(ps)
})

const input = event => {
  if (event.key == 'Right' || event.key == 'ArrowRight') {
    if (prediction) {
      player.position.x += 5
    }

    // socket.send('input', { key: 'right' })
  } else if (event.key == 'Left' || event.key == 'ArrowLeft') {
    if (prediction) {
      player.position.x -= 5
    }

    // socket.send('input', { key: 'left' })
  } else if (event.key == 'Up' || event.key == 'ArrowUp') {
    if (prediction) {
      player.position.y -= 5
    }

    // socket.send('input', { key: 'up' })
  } else if (event.key == 'Down' || event.key == 'ArrowDown') {
    if (prediction) {
      player.position.y += 5
    }

    // socket.send('input', { key: 'down' })
  }
}

const circle = (x, y, color = '#0000FF') => {
  ctx.beginPath()
  ctx.arc(x, y, 20, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
  ctx.closePath()
}

const canvasSize = 500
const playerSize = 20

const min = playerSize
const max = canvasSize - playerSize

const tick = () => {
  const { up, down, left, right } = inputState

  if (![up, down, left, right].includes(true)) return

  let dx = 0
  let dy = 0

  if (up && !down) dy = -5
  if (down && !up) dy = 5
  if (left && !right) dx = -5
  if (right && !left) dx = 5

  const mag = Math.sqrt(dx * dx + dy * dy)

  let nx = dx !== 0 ? player.position.x + (dx / mag) * 5 : player.position.x
  let ny = dy !== 0 ? player.position.y + (dy / mag) * 5 : player.position.y

  if (dx !== 0) {
    if (nx >= max) nx = max
    if (nx <= min) nx = min
  }

  if (dy !== 0) {
    if (ny >= max) ny = max
    if (ny <= min) ny = min
  }

  player.position.x = nx
  player.position.y = ny
}

const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (player) {
    circle(player.position.x, player.position.y)
  }

  if (players.length) {
    players.forEach(p => {
      circle(p.position.x, p.position.y, p.color)
    })
  }
}

let fpsInterval, startTime, now, then, elapsed

function startLoop(fps) {
  fpsInterval = 1000 / fps
  then = window.performance.now()
  startTime = then
  loop()
}

function loop() {
  requestAnimationFrame(loop)

  now = window.performance.now()
  elapsed = now - then

  if (elapsed > fpsInterval) {
    then = now - (elapsed % fpsInterval)

    draw()
    if (prediction) tick()
  }
}

startLoop(60)

const inputMap = {
  Up: 'up',
  ArrowUp: 'up',
  Down: 'down',
  ArrowDown: 'down',
  Left: 'left',
  ArrowLeft: 'left',
  Right: 'right',
  ArrowRight: 'right',
}

const inputState = {
  up: false,
  down: false,
  left: false,
  right: false,
}

const press = key => {
  let changed

  if (!(key in inputMap)) return

  if (inputState[inputMap[key]] === false) {
    changed = true
  }

  inputState[inputMap[key]] = true

  if (changed) {
    socket.send('input', { input: inputState })
  }
}

const release = key => {
  let changed

  if (!(key in inputMap)) return

  if (inputState[inputMap[key]] === true) {
    changed = true
  }

  inputState[inputMap[key]] = false

  if (changed) {
    socket.send('input', { input: inputState })
  }
}

window.addEventListener('blur', () => {
  inputState.up = false
  inputState.down = false
  inputState.left = false
  inputState.right = false

  socket.send('input', {
    input: inputState,
  })
})
document.addEventListener('keydown', e => press(e.key))
document.addEventListener('keyup', e => release(e.key))
