import cors from 'cors';
import express from 'express';
import peer from 'peer';
import sqlite3 from 'sqlite3';
import WebSocket from 'ws';

const db = new sqlite3.Database('webrtc.db');

const app = express();

const emailToWsMap = {};

// This enables Cross-Origin Resource Sharing (CORS)
// which is needed to allow Socket.io connections from another domain.
app.use(cors());

// This enables parsing JSON request bodies.
app.use(express.json());

// This enables serving static files from a given directory.
app.use(express.static('../client/dist'));

// Broadcast data to all the users in a given room.
async function broadcast(thisWs, roomName, data, includeSelf) {
  const message = JSON.stringify(data);

  // This approach doesn't support sending the message
  // to only clients in the given room.
  //wss.clients.forEach(client => {

  // Get the email addresses of the all the participants in the room.
  const sql = 'select email from participant where roomName = ?';
  const participants = await queryAll(sql, [roomName]);

  for (const participant of participants) {
    const ws = emailToWsMap[participant.email];
    if (ws) {
      const isOpen = ws.readyState === WebSocket.OPEN;
      const shouldSend = isOpen && (includeSelf || ws !== thisWs);
      if (shouldSend) ws.send(message);
    }
  }
}

const conflict = (res, message = '') => res.status(409).send(message);

const dbError = (res, err) => res.status(500).send(err);

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
      console.info('server.js message: type =', type, 'was ignored');
    }
  });
});

// Gets the email address corresponding to a given peer id.
app.get('/peer/:peerId/email', async (req, res) => {
  const {peerId} = req.params;

  const sql = 'select email from peer where peerId = ?';
  try {
    const participant = await queryFirst(sql, [peerId]);
    if (!participant) {
      return notFound(res, `no participant with peerId "${peerId}" found`);
    }
    res.send(participant.email || '');
  } catch (error) {
    console.error('server.js get email of peer: error =', error);
    dbError(res, error);
  }
});

const queryAll = (sql, args) => asyncSqlite('all', sql, args);
const queryFirst = (sql, args) => asyncSqlite('get', sql, args);
const run = (sql, args) => asyncSqlite('run', sql, args);
function asyncSqlite(method, sql, args) {
  console.log('---');
  console.log('server.js asyncSqlite: method =', method);
  console.log('server.js asyncSqlite: sql =', sql);
  console.log('server.js asyncSqlite: args =', args);
  return new Promise((resolve, reject) => {
    db[method](sql, args, (err, result) => {
      console.log('server.js asyncSqlite: err =', err);
      console.log('server.js asyncSqlite: result =', result);
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Gets all the existing rooms.
app.get('/room', async (_, res) => {
  const sql = 'select email from participant where roomName = ?';

  try {
    const rooms = await queryAll('select * from room');
    const promises = rooms.map(room => queryAll(sql, [room.name]));
    const results = await Promise.all(promises);

    const roomMap = {};
    rooms.forEach((room, index) => {
      const participants = results[index];
      room.emails = participants.map(p => p.email);
      roomMap[room.name] = room;
    });
    sendJson(res, roomMap);
  } catch (error) {
    dbError(res, error);
  }
});

// Gets a specific room.
app.get('/room/:roomName', async (req, res) => {
  const {roomName} = req.params;

  try {
    let sql = 'select * from room where name = ?';
    const room = await queryFirst(sql, [roomName]);
    if (!room) return notFound(res);

    sql = 'select * from participant where roomName = ?';
    const participants = await queryAll(sql, [roomName]);
    room.emails = participants.map(p => p.email);
    sendJson(res, room);
  } catch (error) {
    dbError(res, error);
  }
});

// Creates a new room.
app.post('/room', async (req, res) => {
  const {name} = req.body;
  const sql = 'insert into room (name) values (?)';
  try {
    await run(sql, [name]);
    const room = {name};
    sendJson(res, room, 201);
  } catch (error) {
    dbError(res, error);
  }
});

/* TODO: Is this used?
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
*/

// Deletes an existing room.
app.delete('/room/:name', async (req, res) => {
  const {name} = req.params;

  // Verify that the room exists.
  try {
    let sql = 'select * from room where name = ?';
    const room = await queryFirst(sql, [name]);
    if (!room) return notFound(res);

    // Get the participants in this room.
    sql = 'select email from participant where roomName = ?';
    const participants = await queryAll(sql, [name]);
    if (participants.length) {
      return conflict(res, 'cannot delete room with participants');
    }

    await run('delete from room where name = ?', [name]);
    res.send();
  } catch (error) {
    dbError(res, error);
  }
});

// Adds a participant to a room.
app.post('/room/:name/email', async (req, res) => {
  const {name} = req.params;
  const {email} = req.body;

  try {
    // Verify that the room exists.
    const room = await queryFirst('select * from room where name = ?', [name]);
    if (!room) return notFound(res);

    // Add the participant to the room.
    let sql = 'insert into participant (email, roomName) values (?, ?)';
    await run(sql, [email, name]);

    // Get all the room participants.
    sql = 'select email from participant where roomName = ?';
    const participants = await queryAll(sql, [name]);
    room.emails = participants.map(p => p.email);
    sendJson(res, room);
  } catch (error) {
    dbError(res, error);
  }
});

// Removes a participant from a room.
app.delete('/room/:name/email/:email', async (req, res) => {
  const {email, name} = req.params;

  try {
    // Verify that the room exists.
    const room = queryFirst('select * from room where name = ?', [name]);
    if (!room) return notFound(res, 'room not found');

    // Verify that the participant exists.
    let sql = 'select * from participant where email = ? and roomName = ?';
    const participant = await queryFirst(sql, [email, name]);
    if (!participant) return notFound(res, 'participant not in room');

    // Get the peer id of the participant.
    sql = 'select peerId from peer where email = ?';
    const peer = await queryFirst(sql, [email]);

    // Delete the participant from the room.
    await run('delete from participant where id = ?', [participant.id]);

    // Let other clients know the participant has left the room.
    broadcast(null, name, {type: 'leave-room', peerId: peer.peerId});
    res.send();
  } catch (error) {
    dbError(res, error);
  }
});

// Associates a peer id with an email.
app.post('/user', async (req, res) => {
  const {email, peerId} = req.body;
  const sql =
    'insert into peer (email, peerId) values ($email, $peerId) ' +
    'on conflict(email) do update set peerId = $peerId ';
  try {
    await run(sql, {$email: email, $peerId: peerId});
    res.send();
  } catch (error) {
    dbError(res, error);
  }
});

const PORT = 1234;
//server.listen(PORT);
const server = app.listen(PORT);
console.log('listening on port', PORT);

//app.use('/peerjs', peer.ExpressPeerServer(server, {debug: true}));
app.use('/peerjs', peer.ExpressPeerServer(server));
