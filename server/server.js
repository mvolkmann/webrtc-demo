import cors from 'cors';
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
//import {v4 as uuidV4} from 'uuid';

const app = express();
const server = http.Server(app);

const emailToUserIdMap = {};
const emailToWsMap = {};
const rooms = {};

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

// This enables parsing JSON request bodies.
app.use(express.json());

// Broadcast data to all the users in a given room.
function broadcast(thisWs, roomName, data) {
  const message = JSON.stringify(data);

  // This approach doesn't support sending the message
  // to only clients in the given room.
  //wss.clients.forEach(client => {

  const room = rooms[roomName];
  const webSockets = room.emails.map(email => emailToWsMap[email]);
  for (const ws of webSockets) {
    const isOpen = ws.readyState === WebSocket.OPEN;
    const isSelf = ws === thisWs;
    if (isOpen && !isSelf) ws.send(message);
  }
}

const notFound = (res, message = '') => res.status(404).send(message);

function sendJson(res, obj, status = 200) {
  res.set('Content-Type', 'application/json');
  res.status(status).send(JSON.stringify(obj));
}

/*
// Can remove this after Svelte version is working.
app.get('/ejs', (req, res) => {
  // This gives every user a unique room id.
  const roomId = uuidV4();
  console.log('server.js x: roomId =', roomId);
  res.redirect('/ejs/' + roomId);
});

// Can remove this after Svelte version is working.
app.get('/ejs/:roomId', (req, res) => {
  // This uses the room.ejs file in the views directory
  // to generate the HTML that is returned to the browser.
  // "roomId" will be available in template tags.
  // It will also be appended to the URL as a path parameter.
  const {roomId} = req.params;
  console.log('server.js y: roomId =', roomId);
  res.render('room', {roomId});
});
*/

// Create a WebSocket server.
const wss = new WebSocket.Server({port: 1919});

// When a client connects ...
wss.on('connection', (ws, req) => {
  //const ip = req.socket.remoteAddress;
  //console.log('script.js connection: ip =', ip);

  // When a message is received ...
  ws.on('message', message => {
    console.log('script.js message: message =', message);
    const json = JSON.parse(message);
    console.log('script.js message: json =', json);
    const {email, type, roomName} = json;
    emailToWsMap[email] = ws;
    if (type === 'join-room') {
      const userId = emailToUserIdMap[email];
      broadcast(ws, roomName, {type: 'user-connected', userId});
    }
  });
});

// Retrieves all the existing rooms.
app.get('/room', (req, res) => {
  sendJson(res, rooms);
});

// Retrieves a specific room.
app.get('/room/:roomName', (req, res) => {
  const {roomName} = req.params;
  const room = rooms[roomName];
  if (room) {
    sendJson(res, room);
  } else {
    notFound(res);
  }
});

// Creates a new room.
app.post('/room', (req, res) => {
  const {name} = req.body;
  if (rooms[name]) {
    return res.status(409).send('room already exists'); // CONFLICT
  }
  const room = {name, emails: []};
  rooms[name] = room;
  sendJson(res, room, 201);
});

// Updates an existing room.
app.put('/room/:roomName', (req, res) => {
  const {roomName} = req.params;
  const room = rooms[roomName];
  if (!room) return notFound(res);

  if (room.emails.length) {
    // CONFLICT
    return res.status(409).send('cannot update room with participants');
  }

  const newRoom = req.body;
  if (newRoom.name === room.name) {
    rooms[room.name] = newRoom;
  } else {
    delete rooms[room.name];
    rooms[newRoom.name] = newRoom;
  }
  res.send();
});

// Deletes an existing room.
app.delete('/room/:roomName', (req, res) => {
  const {roomName} = req.params;
  const room = rooms[roomName];
  if (!room) return notFound(res);

  if (room.emails.length) {
    // CONFLICT
    return res.status(409).send('cannot delete room with participants');
  }

  delete rooms[roomName];
  res.send();
});

// Adds a participant to a room.
app.post('/room/:roomName/email', (req, res) => {
  const {roomName} = req.params;
  const room = rooms[roomName];
  if (!room) return notFound(res);

  const {email} = req.body;
  if (!room.emails.includes(email)) room.emails.push(email);

  sendJson(res, room);
});

// Removes a participant from a room.
app.delete('/room/:roomName/email/:email', (req, res) => {
  const {email, roomName} = req.params;
  const room = rooms[roomName];
  if (!room) return notFound(res);

  if (!room.emails.includes(email)) {
    return notFound(res, 'participant not in room');
  }

  room.emails = room.emails.filter(p => p !== email);

  const userId = emailToUserIdMap[email];
  broadcast(null, roomName, {type: 'leave-room', userId});

  res.send();
});

// Associates a user id with an email.
app.post('/user', (req, res) => {
  const {email, userId} = req.body;
  emailToUserIdMap[email] = userId;
  res.send();
});

const PORT = 1234;
server.listen(PORT);
console.log('listening on port', PORT);
