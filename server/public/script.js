const PEER_PORT = 3001; // matches port in package.json script
const peerMap = {};
let stream;
let userId; // The Peer server will generate this.
let ws;

let wsOpen = false;

const videoGrid = document.getElementById('video-grid');

const userIdToWsMap = {};
const wsToUserIdMap = {};

// The first argument to the Peer constructor is the user id.
// Passing undefined means that Peer will assign a random id.
const myPeer = new Peer(undefined, {
  //debug: 3, // for more debugging output
  host: '/',
  port: PEER_PORT
});

// When I have connected to the Peer server ...
myPeer.on('open', thisUserId => {
  userId = thisUserId;
  peerMap[userId] = myPeer;
  console.log('script.js: My userId is', userId);

  // ROOM_ID is set in views/room.ejs.
  console.log('script.js: I am in room', ROOM_ID);

  setup();
});

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

function connectToOtherUser(userId, stream) {
  // Create a video element for rendering their stream.
  const video = document.createElement('video');
  video.id = 'user-' + userId;

  // Share my stream with the other user
  // so they can render it in a new video element.
  const call = myPeer.call(userId, stream);

  // When another user shares their stream with me,
  // add the video element that renders their stream.
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });

  //TODO: Why is this event never sent?
  //TODO: You also remove the video when a "user-disconnected" event
  //TODO: is received, so that takes care of this need too.
  // When another user closes their stream,
  // remove the video element that was rendering their stream.
  call.on('close', () => {
    console.log('script.js call of other user closed');
    video.remove();
  });

  peerMap[userId] = call;
}

function destroyPeer() {
  //TODO: Why was this needed?
  //if (ws) ws.send(JSON.stringify(data));

  const peer = peerMap[userId];
  if (peer) {
    peer.destroy();
    delete peerMap[userId];
  }
}

function openWebSocket() {
  // Open a connection to the WebSocket server.
  const WS_URL = 'ws://localhost:1919';
  ws = new WebSocket(WS_URL);

  window.onbeforeunload = destroyPeer;

  // When a client connects ...
  ws.addEventListener('open', event => {
    const message = {type: 'join-room', roomId: ROOM_ID, userId};
    ws.send(JSON.stringify(message));
  });

  // When a WebSocket message is received ...
  ws.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    console.log('script.js message: data =', data);
    const {type, userId} = data;

    if (type === 'user-connected') {
      console.log('script.js user-connected: userId =', userId);
      connectToOtherUser(userId, stream);
    } else if (type === 'user-disconnected') {
      console.log('script.js user-disconnected: userId =', userId);
      const video = document.getElementById('user-' + userId);
      video.remove();
    }
  });

  // When the WebSocket connection is closed ...
  ws.addEventListener('close', destroyPeer);
}

async function setup() {
  try {
    // Show my video.
    const myVideo = document.createElement('video');
    myVideo.muted = true; // don't play my own sound
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    addVideoStream(myVideo, stream);

    openWebSocket();

    // Don't listen for "call" events until we have the stream!
    // See https://github.com/WebDevSimplified/Zoom-Clone-With-WebRTC/issues/56.
    // When another user wants to connect to me ...
    // This is called once for each client that connects to this one.
    myPeer.on('call', call => {
      // Send my stream to the other user.
      call.answer(stream);

      // Create a video element for rendering their stream.
      const otherVideo = document.createElement('video');

      // When another user shares their stream with me,
      // add the video element that renders their stream.
      call.on('stream', otherVideoStream => {
        addVideoStream(otherVideo, otherVideoStream);
      });
    });
  } catch (e) {
    console.error('setup error:', e);
  }
}
