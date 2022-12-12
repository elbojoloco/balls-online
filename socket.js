const ws = new WebSocket(`wss://elbojoloco-urban-engine-vjj6gp6xx6fpvww-8001.preview.app.github.dev`)
const encoder = new TextEncoder()
const decoder = new TextDecoder()

const lag = 0

ws.binaryType = 'arraybuffer'

class Socket {
  #listeners = {}

  constructor() {
    ws.onmessage = message => {
      const { type, data } = JSON.parse(decoder.decode(message.data))

      if (type in this.#listeners) {
        this.#listeners[type].forEach(cb => cb(data))
      }
    }
  }

  send(type, data) {
    const body = encoder.encode(
      JSON.stringify({
        type,
        data,
      })
    )

    setTimeout(() => {
      ws.send(body)
    }, lag)
  }

  listen(type, cb) {
    if (!(type in this.#listeners)) {
      this.#listeners[type] = []
    }

    this.#listeners[type].push(cb)
  }

  // disconnect() {
  //   ws.disconnect()
  // }
}

const socket = new Socket()

export { socket }
