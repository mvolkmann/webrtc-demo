<script>
  // @ts-nocheck

  import Icon from 'fa-svelte';
  import {
    faComments,
    faDesktop,
    faDoorClosed,
    faHandPaper,
    faMicrophone,
    faVideo
  } from '@fortawesome/free-solid-svg-icons';
  import {createEventDispatcher, onMount, tick} from 'svelte';

  import {deleteResource} from './fetch-util.js';
  import {
    audioOnStore,
    currentRoomStore,
    emailStore,
    roomsStore
  } from './stores.js';
  import {enableTrack, joinRoom, wsSendJson} from './webrtc-util.js';

  const dispatch = createEventDispatcher();

  let chat = false;
  let errorMessage = '';
  let handRaised = false;
  let participants = [];
  let shareScreen = false;
  let shareScreenVideo;
  let videoGrid;
  let videoOn = true;

  $: roomName = $currentRoomStore ? $currentRoomStore.name : '';

  onMount(() => {
    joinRoom(roomName, addParticipant, removeParticipant, setHandRaised);
    participants.forEach(addStream);
  });

  function addStream(participant) {
    const container = document.getElementById(participant.peerId);
    if (container) {
      const video = container.querySelector('video');
      video.srcObject = participant.stream;
    }
  }

  async function addParticipant(email, peerId, stream) {
    let participant = participants.find(p => p.email === email);
    if (participant) {
      // If the stream is already associated with this participant ...
      if (stream === participant.stream) {
        console.log('Room.svelte addParticipant: duplicate stream');
        return;
      }
    } else {
      participant = {email, peerId};
      participants.push(participant);
      participants = participants; // trigger reactivity
    }
    participant.stream = stream;

    // Wait for the UI to update.
    await tick();

    const video = document.createElement('video');
    if (email === $emailStore) video.muted = true; // don't play my own sound
    video.addEventListener('canplay', () => {
      video.play();
    });
    const container = document.getElementById(peerId);
    container.append(video);
    addStream(participant);
  }

  async function leaveRoom() {
    try {
      const email = $emailStore;
      await deleteResource(`room/${roomName}/email/${email}`);
      roomsStore.update(theRooms => {
        const room = theRooms[roomName];
        room.emails.filter(e => e !== email);
        return theRooms;
      });
      $currentRoomStore = null;
      errorMessage = '';
      dispatch('show', 'rooms');
    } catch (e) {
      console.error('Room.svelte leaveRoom: e =', e);
      errorMessage = 'Error leaving room: ' + e;
    }
  }

  function removeParticipant(peerId) {
    participants = participants.filter(p => p.peerId !== peerId);
  }

  function setHandRaised(email, handRaised) {
    const participant = participants.find(p => p.email === email);
    if (participant) {
      participant.handRaised = handRaised;
      participants = participants; // toggle reactivity
    }
  }

  function toggleAudio() {
    $audioOnStore = !$audioOnStore;
    enableTrack('audio', $audioOnStore);
  }

  function toggleHandRaised() {
    handRaised = !handRaised;

    // Set in my participant object.
    const email = $emailStore;
    const participant = participants.find(p => p.email === email);
    participant.handRaised = handRaised;
    participants = participants; // toggle reactivity

    // Set in other participant objects.
    wsSendJson({type: 'toggle-hand', email, handRaised, roomName});
  }

  async function toggleShareScreen() {
    shareScreen = !shareScreen;
    if (shareScreen) {
      const options = {
        audio: false,
        video: {cursor: 'always'}
      };
      const stream = await navigator.mediaDevices.getDisplayMedia(options);
      shareScreenVideo.srcObject = stream;
      //TODO: Add a track using this stream to the Peer object.
    } else {
      const stream = shareScreenVideo.srcObject;
      shareScreenVideo.srcObject = null;
      stream.getTracks().forEach(track => track.stop());
    }
    //senders.find(sender => sender.track.kind === 'video').replaceTrack(displayMediaStream.getTracks()[0]);
  }

  function toggleVideo() {
    videoOn = !videoOn;
    enableTrack('video', videoOn);
  }

</script>

<section class="room">
  <h2>
    <span>{roomName} Room</span>
    <button class="bare" title="leave room" on:click={leaveRoom}>
      <Icon icon={faDoorClosed} />
    </button>
  </h2>

  {#if errorMessage}
    <div class="error">{errorMessage}</div>
  {/if}

  <div class="buttons">
    <button
      class={'bare' + ($audioOnStore ? '' : ' off')}
      title="toggle audio"
      on:click={toggleAudio}
    >
      <Icon icon={faMicrophone} />
    </button>
    <button
      class={'bare' + (videoOn ? '' : ' off')}
      title="toggle video"
      on:click={toggleVideo}
    >
      <Icon icon={faVideo} />
    </button>
    <button
      class={'bare' + (shareScreen ? '' : ' off')}
      title="share screen"
      on:click={toggleShareScreen}
    >
      <Icon icon={faDesktop} />
    </button>
    <button
      class={'bare' + (chat ? '' : ' off')}
      title="show chat"
      on:click={() => (chat = !chat)}
    >
      <Icon icon={faComments} />
    </button>
    <button
      class={'bare' + (handRaised ? '' : ' off')}
      title="raise hand"
      on:click={toggleHandRaised}
    >
      <Icon icon={faHandPaper} />
    </button>
  </div>

  <div id="video-grid" bind:this={videoGrid}>
    {#each participants as participant}
      <div id={participant.peerId} class="container">
        <div class="row">
          <div class="email">{participant.email}</div>
          <div class:off={!participant.handRaised}>
            <Icon icon={faHandPaper} />
          </div>
        </div>
      </div>
    {/each}
  </div>

  {#if shareScreen}
    <video id="share-screen" autoplay bind:this={shareScreenVideo}>
      <track kind="captions" />
      <track kind="video" />
    </video>
  {/if}
</section>

<style>
  h2 {
    display: flex;
    align-items: center;
  }

  h2 > button {
    margin-left: 1rem;
  }

  .off :global(.fa-svelte) {
    color: lightgray;
  }

  .room {
    padding: 2rem;
  }

  .row {
    display: flex;
    justify-content: space-between;
  }

  .row :global(.fa-svelte) {
    color: var(--secondary-color);
  }

  .row .off :global(.fa-svelte) {
    color: lightgray;
  }

  #share-screen {
    margin-top: 3rem;
    width: 100%;
  }

  #video-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, 300px);
    grid-auto-rows: 300px;
    margin-top: 1rem;
  }

  #video-grid :global(video) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

</style>
