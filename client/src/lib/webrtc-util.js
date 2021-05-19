import Peer from 'peerjs';
import {postJson} from './fetch-util.js';

const PEER_PORT = 3001; // matches port in package.json script

//TODO: Will lose this on refresh!
const peerMap = {};

let myPeer;
let myStream;
let myUserId; // The Peer server will generate this.
let myVideoGrid;
let ws;

// This needs to happen on every browser refresh.
createWebSocket();

function addVideoStream(video, stream, userId) {
  // If the video is already associated with this stream ...
  if (stream === video.srcObject) return;

  if (userId) video.id = 'user-' + userId;
  video.srcObject = stream;
  myVideoGrid.append(video);
  video.addEventListener('canplay', () => {
    video.play();
  });
}

// This is called when we receive a WebSocket message
// informing us that another user has joined the room we are in.
function connectToOtherUser(userId) {
  // Create a video element for rendering their stream.
  const video = document.createElement('video');

  // Share my stream with the other user
  // so they can render it in a new video element.
  const call = myPeer.call(userId, myStream);

  // When another user shares their stream with me,
  // add a video element that renders their stream.
  call.on('stream', stream => {
    addVideoStream(video, stream, call.peer);
  });

  call.on('error', error => {
    alert('Error sharing Peer stream: ' + error);
  });

  // This event is never sent.
  // See https://github.com/peers/peerjs/issues/780.
  // When another user closes their stream,
  // remove the video element that was rendering their stream.
  //TODO: This should be triggered by destroyPeer in webrtc-util.js!
  call.on('close', () => {
    console.log('webrtc-util.js connectToOtherUser: got close event');
    video.remove();
  });

  //TODO: Is a call the same thing as a peer?
  peerMap[userId] = call;
}

function createPeer(email) {
  // The first argument to the Peer constructor is the user id.
  // Passing undefined means that Peer will assign a random id.
  myPeer = new Peer(undefined, {
    //debug: 3, // for more debugging output
    host: '/',
    port: PEER_PORT
  });

  // When I connect to the Peer server, it will supply a generated user id.
  myPeer.on('open', async thisUserId => {
    myUserId = thisUserId;

    try {
      await postJson('user', {email, userId: myUserId});
    } catch (e) {
      console.error('error associating userId with email:', e);
    }

    peerMap[myUserId] = myPeer;

    // It is important that myStream is set before we listen for "call" events.
    // See https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC/issues/56.
    // When another user wants to connect to me ...
    myPeer.on('call', call => {
      // This is called once for each client that connects to this one.

      // Send my stream to the other user.
      call.answer(myStream);

      // When another user shares their stream with me,
      // add the video element that renders their stream.
      //TODO: How can we know the userId associated with otherStream?
      call.on('stream', otherStream => {
        // Determine if we already have video element that is using this stream.
        const videos = Array.from(myVideoGrid.querySelectorAll('video'));
        const alreadyUsing = videos.some(
          video => video.srcObject.id === otherStream.id
        );
        if (alreadyUsing) return;

        // Create a video element for rendering their stream.
        const otherVideo = document.createElement('video');

        // call.peer holds the userId associated with otherStream.
        addVideoStream(otherVideo, otherStream, call.peer);
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
  ws = new WebSocket(WS_URL);

  window.onbeforeunload = destroyPeer;

  // When a WebSocket message is received ...
  ws.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    console.log('webrtc-util.js received ws message: data =', data);
    const {type, userId} = data;

    // We only receive this kind of message
    // for users that join a room we are in.
    if (type === 'user-connected') {
      connectToOtherUser(userId);
    } else if (type === 'leave-room') {
      const video = document.getElementById('user-' + userId);
      video.remove();
    } else {
      console.log('webrtc-util.js message: type =', type, 'was ignored');
    }
  });

  // When the WebSocket connection is closed ...
  ws.addEventListener('close', destroyPeer);
}

function destroyPeer() {
  console.log('webrtc-util.js destroyPeer: entered');
  const peer = peerMap[myUserId];
  if (peer) {
    peer.destroy();
    delete peerMap[myUserId];
  }
}

export function enableTrack(kind, enabled) {
  if (!myStream) return;
  const tracks = myStream.getTracks();
  for (const track of tracks) {
    if (track.kind === kind) track.enabled = enabled;
  }
}

export async function joinRoom(email, roomName, videoGrid) {
  myVideoGrid = videoGrid;

  // Show my video.
  const myVideo = document.createElement('video');
  myVideo.muted = true; // don't play my own sound
  addVideoStream(myVideo, myStream, myUserId);

  // Inform all the other users that you have joined the room.
  const message = {type: 'join-room', email, roomName, userId: myUserId};
  send(message);
}

export function send(message) {
  const intervalId = setInterval(() => {
    console.log('webrtc-util.js send: ws.readyState =', ws.readyState);
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(message));
      clearInterval(intervalId);
    } else {
      console.log('webrtc-util.js send: waiting for ws to open');
    }
  }, 1000);
}

export async function wtcSetup(email, audioOn) {
  await createStream(audioOn);
  createPeer(email);
}
