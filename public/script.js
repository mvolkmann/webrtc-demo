const PEER_PORT = 3001;

const socket = io('/');

const myPeer = new Peer(undefined, {
  host: '/',
  port: PEER_PORT
});
const peers = {};

const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');

// Don't play sound from video where sound is being recorded.
myVideo.muted = true;

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

function connectToNewUser(userId, stream) {
  const video = document.createElement('video');

  const call = myPeer.call(userId, stream);
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  });

  peers[userId] = call;
}

async function setup() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    addVideoStream(myVideo, stream);

    myPeer.on('call', call => {
      call.answer(stream);
      const video = document.createElement('video');
      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on('user-connected', userId => {
      connectToNewUser(userId, stream);
    });
  } catch (e) {
    console.error('setup error:', e);
  }
}

setup();
