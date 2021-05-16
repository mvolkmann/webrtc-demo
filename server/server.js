import cors from 'cors';
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import {v4 as uuidV4} from 'uuid';

const app = express();
const server = http.Server(app);

const roomToUsersMap = {};
const userToWsMap = {};

// This enables rendering HTML from .ejs files in the views directory.
// Can remove this after Svelte version is working.
app.set('view engine', 'ejs');

// This enables Cross-Origin Resource Sharing (CORS)
// which is needed to allow Socket.io connections from another domain.
app.use(cors());

// This enables serving static files from the public directory.
// This includes the script.js file.
// Can remove this after Svelte version is working.
app.use(express.static('public'));

// Can remove this after Svelte version is working.
app.get('/', (req, res) => {
  // This gives every user a unique room id.
  const roomId = uuidV4();
  res.redirect('/' + roomId);
});

// Can remove this after Svelte version is working.
app.get('/:roomId', (req, res) => {
  // This uses the room.ejs file in the views directory
  // to generate the HTML that is returned to the browser.
  // "roomId" will be available in template tags.
  // It will also be appended to the URL as a path parameter.
  res.render('room', {roomId: req.params.roomId});
});

// Create a WebSocket server.
const wss = new WebSocket.Server({port: 1919});

// When a client connects ...
wss.on('connection', (ws, req) => {
  //const ip = req.socket.remoteAddress;
  //console.log('script.js connection: ip =', ip);

  // Broadcast data to all the users in a given room.
  function broadcast(roomId, data) {
    const message = JSON.stringify(data);

    // This approach doesn't support sending the message
    // to only clients in the given room.
    //wss.clients.forEach(client => {

    const userIds = roomToUsersMap[roomId];
    const clients = userIds.map(userId => userToWsMap[userId]);
    for (const client of clients) {
      const isOpen = client.readyState === WebSocket.OPEN;
      const isSelf = client === ws;
      if (isOpen && !isSelf) client.send(message);
    }
  }

  // When a message is received ...
  ws.on('message', message => {
    console.log('script.js message: message =', message);
    const json = JSON.parse(message);
    console.log('script.js message: json =', json);
    const {type, roomId, userId} = json;
    userToWsMap[userId] = ws;
    if (type === 'join-room') {
      let users = roomToUsersMap[roomId];
      if (!users) users = roomToUsersMap[roomId] = [];
      users.push(userId);
      broadcast(roomId, {type: 'user-connected', userId});
    } else if (type === 'user-disconnected') {
      // Let all the other users in the same rooms know that
      // they disconnected so their video can be removed.
      const rooms = Object.keys(roomToUsersMap).filter(roomId =>
        roomToUsersMap[roomId].includes(userId)
      );
      for (const roomId of rooms) {
        broadcast(roomId, {type: 'user-disconnected', userId});
      }
    }
  });
});

const PORT = 1234;
server.listen(PORT);
console.log('listening on port', PORT);
