# balls-online

Balls online is a multiplayer browser game where you are a ball. You can move your ball and see other balls moving. The only purpose it serves is as a playground for game and netcode concepts.

## Setup

1. `yarn`
2. `yarn dev`
3. In a different terminal: `node server.js --watch`
4. Visit [http://localhost:5173](http://localhost:5173)
5. Use the arrow keys to move around

## Variables

- In `socket.js`, you can configure lag emulation in ms by changing the `lag` value. The client will wait this long to send your events to the server.
- In `main.js`, you can turn client prediction on/off by changing the `prediction` boolean.

## TODO

- [ ] Add lag emulation when receiving events as well
- [ ] Split up files
- [ ] Add server reconciliation support
- [ ] Add client-side interpolation support
- [ ] Implement better client-side prediction
- [ ] Convert to TS
