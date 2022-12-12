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
  })

  ws.on('close', () => {
    console.log('Disconnect: ', ws.id)
    delete players[ws.id]
  })

  console.log(players)
})

const tick = () => {
  Object.keys(players).forEach(id => {
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

const FPS = 15 // Frames per second
const frameTime = 1000 / FPS // Time for each frame in milliseconds

let previousTime = Date.now() // The time at the start of the previous frame

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
