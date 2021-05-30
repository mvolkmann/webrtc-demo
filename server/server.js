import cors from 'cors';
import express from 'express';
import peer from 'peer';
import sqlite3 from 'sqlite3';
import WebSocket from 'ws';

const db = new sqlite3.Database('webrtc.db');

const app = express();

const emailToPeerIdMap = {};
const emailToWsMap = {};
const peerIdToEmailMap = {};
const rooms = {};

// This enables Cross-Origin Resource Sharing (CORS)
// which is needed to allow Socket.io connections from another domain.
app.use(cors());

// This enables parsing JSON request bodies.
app.use(express.json());

// This enables serving static files from a given directory.
app.use(express.static('../client/dist'));

// Broadcast data to all the users in a given room.
function broadcast(thisWs, roomName, data, includeSelf) {
  const message = JSON.stringify(data);

  // This approach doesn't support sending the message
  // to only clients in the given room.
  //wss.clients.forEach(client => {

  const room = rooms[roomName];
  if (room) {
    const webSockets = room.emails.map(email => emailToWsMap[email]);
    for (const ws of webSockets) {
      if (ws) {
        const isOpen = ws.readyState === WebSocket.OPEN;
        const shouldSend = isOpen && (includeSelf || ws !== thisWs);
        if (shouldSend) ws.send(message);
      }
    }
  } else {
    console.error(`server.js broadcast: no room named ${roomName} found`);
  }
}

const conflict = (res, message = '') => res.status(409).send(message);

const notFound = (res, message = '') => res.status(404).send(message);

function sendJson(res, obj, status = 200) {
  res.set('Content-Type', 'application/json');
  res.status(status).send(JSON.stringify(obj));
}

// Create a WebSocket server.
const wss = new WebSocket.Server({port: 1919});

// When a client connects ...
wss.on('connection', ws => {
  //const ip = req.socket.remoteAddress;
  //console.log('server.js connection: ip =', ip);

  // When a message is received ...
  ws.on('message', message => {
    const json = JSON.parse(message);
    console.log('server.js message: json =', json);
    const {peerId, roomName, type} = json;
    if (type === 'join-room') {
      const {email} = json;
      emailToWsMap[email] = ws;
      broadcast(ws, roomName, {type: 'user-connected', email, peerId});
    } else if (type === 'stop-screen-share') {
      broadcast(ws, roomName, {type: 'stop-screen-share', peerId});
    } else if (type === 'toggle-hand') {
      const {email, handRaised} = json;
      broadcast(ws, roomName, {type: 'toggle-hand', email, handRaised});
    } else {
      console.log('server.js message: type =', type, 'was ignored');
    }
  });
});

// Gets the email address corresponding to a given peer id.
app.get('/peer/:peerId/email', (req, res) => {
  const {peerId} = req.params;
  res.send(peerIdToEmailMap[peerId] || '');
});

// Gets all the existing rooms.
app.get('/room', (_, res) => {
  db.all('select * from room', (err, rooms) => {
    if (err) return res.status(500).send(err);

    const roomMap = {};

    let error;

    for (const room of rooms) {
      room.emails = [];
      //TODO: Use a prepared statement.
      db.all(
        `select * from participants where roomId = ${room.id}`,
        (err, participants) => {
          if (err) {
            error = err;
          } else {
            room.emails = participants.map(p => p.email);
          }
        }
      );
      roomMap[room.name] = room;
    }

    if (error) {
      res.status(500).send(error);
    } else {
      sendJson(res, roomMap);
    }
  });
});

// Gets a specific room.
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
    return conflict(res, 'room already exists');
  }
  const room = {name, emails: []};
  rooms[name] = room;

  const sql = `insert into room (name) values ("${name}")`;
  db.run(sql);

  sendJson(res, room, 201);
});

// Updates an existing room.
app.put('/room/:roomName', (req, res) => {
  const {roomName} = req.params;
  const room = rooms[roomName];
  if (!room) return notFound(res);

  if (room.emails.length) {
    return conflict(res, 'cannot update room with participants');
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
    return conflict(res, 'cannot delete room with participants');
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

  const peerId = emailToPeerIdMap[email];
  broadcast(null, roomName, {type: 'leave-room', peerId});

  res.send();
});

// Associates a user id with an email.
app.post('/user', (req, res) => {
  const {email, peerId} = req.body;
  emailToPeerIdMap[email] = peerId;
  peerIdToEmailMap[peerId] = email;
  res.send();
});

const PORT = 1234;
//server.listen(PORT);
const server = app.listen(PORT);
console.log('listening on port', PORT);

//app.use('/peerjs', peer.ExpressPeerServer(server, {debug: true}));
app.use('/peerjs', peer.ExpressPeerServer(server));
