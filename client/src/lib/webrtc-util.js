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
  if (stream === video.srcObject) return;

  if (userId) video.id = 'user-' + userId;
  video.srcObject = stream;
  myVideoGrid.append(video);
  video.addEventListener('canplay', () => {
    video.play();
  });
}

function connectToOtherUser(userId) {
  console.log('webrtc-util.js connectToOtherUser: userId =', userId);

  // Create a video element for rendering their stream.
  const video = document.createElement('video');

  // Share my stream with the other user
  // so they can render it in a new video element.
  const call = myPeer.call(userId, myStream);

  // When another user shares their stream with me,
  // add a video element that renders their stream.
  call.on('stream', stream => {
    addVideoStream(video, stream, userId);
  });

  // This event is never sent.
  // See https://github.com/peers/peerjs/issues/780.
  // When another user closes their stream,
  // remove the video element that was rendering their stream.
  //TODO: This should be triggered by destroyPeer in webrtc-util.js!
  call.on('close', () => {
    console.log('script.js connectToOtherUser: got close event');
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

  // When I have connected to the Peer server,
  // it will supply a generated user id.
  myPeer.on('open', async thisUserId => {
    myUserId = thisUserId;

    try {
      await postJson('user', {email, userId: myUserId});
    } catch (e) {
      console.error('error associating userId with email:', e);
    }

    console.log('webrtc-util.js open event: myUserId =', myUserId);
    peerMap[myUserId] = myPeer;

    // It is important that myStream is set before we listen for "call" events.
    // See https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC/issues/56.
    // When another user wants to connect to me ...
    myPeer.on('call', call => {
      // This is called once for each client that connects to this one.
      console.log('webrtc-util.js open: call event received');

      // Send my stream to the other user.
      call.answer(myStream);

      // When another user shares their stream with me,
      // add the video element that renders their stream.
      call.on('stream', otherStream => {
        // If we already have video element that is using this stream ...
        const videos = Array.from(myVideoGrid.querySelectorAll('video'));
        const alreadyUsing = videos.some(
          video => video.srcObject.id === otherStream.id
        );
        if (alreadyUsing) return;

        // Create a video element for rendering their stream.
        const otherVideo = document.createElement('video');
        //TODO: How can you get the userId of other other user
        //TODO: so you can set the id of this video element?

        console.log('webrtc-util.js peer call: calling addVideoStream');
        addVideoStream(otherVideo, otherStream);
      });
    });
  });
}

async function createStream() {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
  } catch (e) {
    console.error('createStream error:', e);
  }
}

function createWebSocket() {
  // Open a connection to the WebSocket server.
  const WS_URL = 'ws://localhost:1919';
  ws = new WebSocket(WS_URL);
  console.log('webrtc-util.js createWebSocket: ws =', ws);

  window.onbeforeunload = destroyPeer;

  // When a WebSocket message is received ...
  ws.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    console.log('script.js message: data =', data);
    const {type, userId} = data;

    if (type === 'user-connected') {
      console.log('script.js user-connected: userId =', userId);
      connectToOtherUser(userId);
    } else if (type === 'leave-room') {
      console.log('script.js leave-room: userId =', userId);
      const video = document.getElementById('user-' + userId);
      video.remove();
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

export async function joinRoom(email, roomName, videoGrid) {
  myVideoGrid = videoGrid;

  // Show my video.
  const myVideo = document.createElement('video');
  myVideo.muted = true; // don't play my own sound
  console.log('webrtc-util.js joinRoom: calling addVideoStream');
  addVideoStream(myVideo, myStream);

  // Inform all the other users that you have joined the room.
  const message = {email, type: 'join-room', roomName};
  console.log('webrtc-util.js joinRoom: ws =', ws);
  console.log('webrtc-util.js joinRoom: message =', message);
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

export async function wtcSetup(email) {
  await createStream();
  createPeer(email);
}
