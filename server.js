const { Server } = require('ws')
// const { createClient } = require('redis')
// const client = createClient()

// ;(async () => {
//   client.on('error', err => console.log('Redis Client Error', err))

//   await client.connect()
// })()

const canvasSize = 500
const playerSize = 20

const min = playerSize
const max = canvasSize - playerSize

const players = {}

const socketServer = new Server({ port: 8001 })

function randomColor() {
  // Generate a random number between 0 and 255 for each of the red, green, and blue channels
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)

  // Check if the color is a shade of blue by comparing the red and green values to the blue value
  if (r === b && g === b) {
    // If it is, generate a new color
    return randomColor()
  } else {
    // If it isn't, return the color as a hexadecimal string
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  }
}

socketServer.on('connection', (ws, req) => {
  ws.id = req.headers['sec-websocket-key']

  const player = {
    id: ws.id,
    color: randomColor(),
    position: {
      x: Math.floor(Math.random() * (max - min) + min),
      y: Math.floor(Math.random() * (max - min) + min),
    },
    input: {
      up: false,
      down: false,
      left: false,
      right: false,
    },
    mouse: {
      x: 0,
      y: 0
    },
    lastMouseEvent: null
  }

  const initData = {
    type: 'init',
    data: { player },
  }

  players[ws.id] = player

  ws.send(Buffer.from(JSON.stringify(initData)))

  ws.on('message', message => {
    const data = JSON.parse(message.toString())

    if (data.type === 'input') {
      players[ws.id].input = data.data.input
    }

    if (data.type === 'mouse') {
      players[ws.id].mouse = data.data.mouse
      players[ws.id].lastMouseEvent = Date.now()
    }
  })

  ws.on('close', () => {
    console.log('Disconnect: ', ws.id)
    delete players[ws.id]
  })

  console.log(players)
})


const isUsingMouse = (playerId) => {
  return (Date.now() - players[playerId].lastMouseEvent) < 200
}

const deadzone = 3

const handleMouseInputs = player => {
  dx = player.mouse.x - player.position.x
  dy = player.mouse.y - player.position.y

  if (Math.abs(dx) > deadzone|| Math.abs(dy) > deadzone) {
    const mag = Math.sqrt(dx*dx + dy*dy)

    let nx =
      dx !== 0
        ? player.position.x + (dx / mag) * (frameTime / 4)
        : player.position.x
    let ny =
      dy !== 0
        ? player.position.y + (dy / mag) * (frameTime / 4)
        : player.position.y

    if (dx !== 0) {
      if (nx >= max) nx = max
      if (nx <= min) nx = min
    }

    if (dy !== 0) {
      if (ny >= max) ny = max
      if (ny <= min) ny = min
    }

    player.position.x += dx/mag * 5
    player.position.y += dy/mag * 5
  }
} 

// const handleKeyboardInputs = () => {

// }

function getLightness(hex) {
  // extract the red, green, and blue components from the hexadecimal string
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  // calculate the lightness using the formula
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}

const kill = player => {
  console.log('Killing ', player)
  socketServer.clients.forEach(client => {
    if (client.id == player.id) {
      client.send(Buffer.from(JSON.stringify({ type: 'death', data: {} })))
    }

    delete players[player.id];
  })
}

const tick = () => {
  if (Object.keys(players).length > 1) {
    getPlayerPairs().forEach(([p1, p2]) => {
      if (detectCollision(p1, p2)) {
        console.log('collision')
        if (getLightness(p1.color) < getLightness(p2.color)) {
          kill(p2)
        } else {
          kill(p1)
        }
      }
    })
  }

  Object.keys(players).forEach(id => {
    if (isUsingMouse(id) || true) {
      return handleMouseInputs(players[id])
    }

    const { up, down, left, right } = players[id].input

    if (![up, down, left, right].includes(true)) return

    dx = 0
    dy = 0

    if (up && !down) dy = -5
    if (down && !up) dy = 5
    if (left && !right) dx = -5
    if (right && !left) dx = 5

    const mag = Math.sqrt(dx * dx + dy * dy)

    let nx =
      dx !== 0
        ? players[id].position.x + (dx / mag) * (frameTime / 4)
        : players[id].position.x
    let ny =
      dy !== 0
        ? players[id].position.y + (dy / mag) * (frameTime / 4)
        : players[id].position.y

    if (dx !== 0) {
      if (nx >= max) nx = max
      if (nx <= min) nx = min
    }

    if (dy !== 0) {
      if (ny >= max) ny = max
      if (ny <= min) ny = min
    }

    players[id].position.x = nx
    players[id].position.y = ny
  })
}

const FPS = 30 // Frames per second
const frameTime = 1000 / FPS // Time for each frame in milliseconds

let previousTime = Date.now() // The time at the start of the previous frame

const getPlayerPairs = () => {
  // array to store the pairs of players
  const pairs = [];

  const ids = Object.keys(players)

  // outer loop to iterate over the ids in the original array
  for (let i = 0; i < ids.length; i++) {
    // inner loop to iterate over the ids in the original array
    // starting from the current index of the outer loop
    for (let j = i + 1; j < ids.length; j++) {
      // add a new pair of ids to the pairs array
      pairs.push([players[ids[i]], players[ids[j]]]);
    }
  }

  return pairs;
}

function detectCollision(player1, player2) {
  // Calculate the distance between the centers of the two circles
  let dx = player1.position.x - player2.position.x;
  let dy = player1.position.y - player2.position.y;
  let distance = Math.sqrt(dx * dx + dy * dy);

  return distance < playerSize * 2;
}

function gameLoop() {
  const currentTime = Date.now() // The current time
  const timeElapsed = currentTime - previousTime // The time elapsed since the previous frame

  // If enough time has elapsed, update the game state and draw the next frame
  if (timeElapsed >= frameTime) {
    // Update the game state here...
    tick()

    // Draw the next frame here...
    const tickData = {
      type: 'tick',
      data: { players },
    }

    if (socketServer) {
      socketServer.clients.forEach(client =>
        client.send(Buffer.from(JSON.stringify(tickData)))
      )
    }

    previousTime = currentTime // Update the previous time
  }

  // Queue up the next game loop
  setTimeout(gameLoop, 0)
}

// Start the game loop
gameLoop()
