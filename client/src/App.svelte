<script>
  import Peer from 'peerjs';
  import * as io from 'socket.io-client';
  //import * as io from 'socket.io';
  import {v4 as uuidv4} from 'uuid';

  const PEER_PORT = 3001; // matches port in package.json script
  const peers = {};
  let userId = undefined; // the Peer server will generate this
  const myPeer = new Peer(userId, {
    host: '/',
    port: PEER_PORT
  });

  // Every user gets a unique roomId to start.
  let roomId = uuidv4();

  let videoGrid;
  const myVideo = document.createElement('video');
  // Don't play sound from video where sound is being recorded.
  myVideo.muted = true;

  //TODO: This works from client.js, but not from here!
  console.log('App.svelte: io =', io);
  const socket = io('ws://localhost:1234');
  //TODO: The next line is jus for verifying that the
  //TODO: client an communicated with the Socket.io server.
  socket.emit('join-room', 'room-1', 'user-2');
  console.log('App.svelte: sent event to socket');

  socket.on('user-disconnected', userId => {
    console.log('App.svelte user-disconnected: userId =', userId);
    if (peers[userId]) peers[userId].close();
    //TODO: Should you add this? delete peers[userId];
  });

  // The peerjs server assigns user ids.
  myPeer.on('open', aUserId => {
    userId = aUserId; // so changeRoom can access
    changeRoom();
  });

  function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    videoGrid.append(video);
  }

  function changeRoom() {
    console.log('App.svelte changeRoom: roomId =', roomId);
    console.log('App.svelte changeRoom: userId =', userId);
    socket.emit('join-room', roomId, userId);
  }

  function connectToOtherUser(userId, stream) {
    console.log('App.svelte connectToNewUser: userId =', userId);
    // Create a video element for displaying the video stream
    // of the other user.
    const video = document.createElement('video');

    // Send our video stream to the other user.
    const call = myPeer.call(userId, stream);

    // Accept the video stream from the other user.
    call.on('stream', otherVideoStream => {
      addVideoStream(video, otherVideoStream);
    });

    // When the other user disconnects, remove their video from the UI.
    call.on('close', () => {
      video.remove();
    });

    // Remember the call object for the other user.
    peers[userId] = call;
  }

  async function setup() {
    console.log('App.svelte setup: entered');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
        //TODO: How do you enable screen sharing?
      });

      addVideoStream(myVideo, stream);

      // When another user connects to us ...
      myPeer.on('call', call => {
        // Answer their call by sending them our stream of video and audio.
        call.answer(stream);

        // Create element for displaying video from the other user.
        const otherVideo = document.createElement('video');

        // When they send us their stream, add it to the video created above.
        call.on('stream', otherVideoStream => {
          addVideoStream(otherVideo, otherVideoStream);
        });
      });

      socket.on('user-connected', userId => {
        connectToOtherUser(userId, stream);
      });
    } catch (e) {
      console.error('setup error:', e);
    }
  }

  setup();

</script>

<main>
  <h1>WebRTC Demo</h1>
  <form on:submit|preventDefault={changeRoom}>
    <div class="row">
      <label for="user-id">User ID</label>
      <div id="user-id">{userId}</div>
    </div>
    <div class="row">
      <label for="room-id">Room ID</label>
      <input id="room-id" bind:value={roomId} />
      <button>Change Room</button>
    </div>
  </form>
  <div id="video-grid" bind:this={videoGrid} />
</main>

<style>
  label {
    margin-right: 0.5rem;
    text-align: right;
    width: 4.5rem;
  }
  label:after {
    content: ':';
  }

  #room-id {
    width: 16rem;
  }

  .row {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  #video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 300px);
    grid-auto-rows: 300px;
  }

  #video-grid > :global(video) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

</style>
