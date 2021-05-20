import Peer from 'peerjs';
import {getJson, postJson} from './fetch-util.js';

const rootUrl = import.meta.env.VITE_API_ROOT_URL;
const PEER_PORT = rootUrl.split(':')[2];

//TODO: Will lose this on refresh!
const peerMap = {};

let addParticipant;
let myEmail;
let myPeer;
//TODO: Is this also a property of the myPeer object?
let myPeerId; // The Peer server generates this.
let myStream;
let removeParticipant;
let setHandRaised;
let ws;

// This needs to happen on every browser refresh.
createWebSocket();

// This is called when we receive a WebSocket message
// informing us that another user has joined the room we are in.
function connectToOtherUser(email, peerId) {
  // Share my stream with the other user
  // so they can render it in a new video element.
  const call = myPeer.call(peerId, myStream);

  // When another user shares their stream with me,
  // add them as a participant.
  call.on('stream', stream => {
    addParticipant(email, call.peer, stream);
  });

  call.on('error', error => {
    alert('Error sharing Peer stream: ' + error);
  });

  // This event is never sent.
  // See https://github.com/peers/peerjs/issues/780.
  // When another user closes their stream,
  // remove them from the list of participants.
  //TODO: This should be triggered by destroyPeer in webrtc-util.js!
  call.on('close', () => {
    console.log('webrtc-util.js connectToOtherUser: got close event');
    removeParticipant(call.peer);
  });

  //TODO: Is a call the same thing as a peer?
  peerMap[peerId] = call;
}

function createPeer() {
  // The first argument to the Peer constructor is the user id.
  // Passing undefined means that Peer will assign a random id.
  myPeer = new Peer(undefined, {
    //debug: 3, // for more debugging output
    //host: '/',
    host: 'localhost',
    port: PEER_PORT,
    path: '/peerjs'
  });

  // When I connect to the Peer server, it will supply a generated user id.
  myPeer.on('open', async thisPeerId => {
    myPeerId = thisPeerId;

    try {
      await postJson('user', {email: myEmail, peerId: myPeerId});
    } catch (e) {
      console.error('error associating peerId with email:', e);
    }

    peerMap[myPeerId] = myPeer;

    // It is important that myStream is set before we listen for "call" events.
    // See https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC/issues/56.
    // When another user wants to connect to me ...
    myPeer.on('call', call => {
      // This is called once for each client that connects to this one.

      // Send my stream to the other user.
      call.answer(myStream);

      // When another user shares their stream with me,
      // add them as a participant.
      call.on('stream', async otherStream => {
        const peerId = call.peer;
        let email;
        try {
          email = await getJson(`peer/${peerId}/email`);
        } catch (e) {
          email = peerId;
        }

        // call.peer holds the peerId associated with otherStream.
        addParticipant(email, peerId, otherStream);
      });
    });
  });
}

async function createStream(audioOn) {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      audio: audioOn,
      video: true
    });
  } catch (e) {
    console.error('createStream error:', e);
  }
}

function createWebSocket() {
  // Open a connection to the WebSocket server.
  const WS_URL = 'ws://localhost:1919';
  //const WS_URL = 'ws://192.168.4.26:1919';
  ws = new WebSocket(WS_URL);

  window.onbeforeunload = destroyPeer;

  // When a WebSocket message is received ...
  ws.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    console.log('webrtc-util.js received ws message: data =', data);
    const {email, type} = data;

    // We only receive this kind of message
    // for users that join a room we are in.
    if (type === 'user-connected') {
      const {peerId} = data;
      connectToOtherUser(email, peerId);
    } else if (type === 'leave-room') {
      removeParticipant(peerId);
    } else if (type === 'toggle-hand') {
      setHandRaised(email, data.handRaised);
    } else {
      console.log('webrtc-util.js message: type =', type, 'was ignored');
    }
  });

  // When the WebSocket connection is closed ...
  ws.addEventListener('close', destroyPeer);
}

function destroyPeer() {
  console.log('webrtc-util.js destroyPeer: entered');
  const peer = peerMap[myPeerId];
  if (peer) {
    peer.destroy();
    delete peerMap[myPeerId];
  }
}

export function enableTrack(kind, enabled) {
  if (!myStream) return;
  const tracks = myStream.getTracks();
  for (const track of tracks) {
    if (track.kind === kind) track.enabled = enabled;
  }
}

export async function joinRoom(
  roomName,
  addParticipantFn,
  removeParticipantFn,
  setHandRaisedFn
) {
  addParticipant = addParticipantFn;
  removeParticipant = removeParticipantFn;
  setHandRaised = setHandRaisedFn;

  addParticipant(myEmail, myPeerId, myStream);

  // Inform all the other users that you have joined the room.
  const message = {
    type: 'join-room',
    email: myEmail,
    roomName,
    peerId: myPeerId
  };
  wsSendJson(message);
}

export function wsSendJson(message) {
  const intervalId = setInterval(() => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(message));
      clearInterval(intervalId);
    } else {
      console.log('webrtc-util.js send: ws.readyState =', ws.readyState);
      console.log('webrtc-util.js send: waiting for ws to open');
    }
  }, 1000);
}

export async function wtcSetup(email, audioOn) {
  myEmail = email;
  await createStream(audioOn);
  createPeer();
}
