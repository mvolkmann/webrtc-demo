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
  import {createEventDispatcher, onMount} from 'svelte';

  import {deleteResource} from './fetch-util.js';
  import {
    audioOnStore,
    currentRoomStore,
    emailStore,
    roomsStore
  } from './stores.js';
  import {enableTrack, joinRoom} from './webrtc-util.js';

  const dispatch = createEventDispatcher();

  let chat = false;
  let errorMessage = '';
  let handRaised = false;
  let shareScreen = false;
  let videoGrid;
  let videoOn = true;

  $: currentRoomName = $currentRoomStore ? $currentRoomStore.name : '';

  onMount(() => {
    joinRoom($emailStore, currentRoomName, videoGrid);
  });

  async function leaveRoom() {
    try {
      const {name} = $currentRoomStore;
      const email = $emailStore;
      await deleteResource(`room/${name}/email/${email}`);
      roomsStore.update(theRooms => {
        const room = theRooms[name];
        room.emails.filter(e => e !== email);
        return theRooms;
      });
      $currentRoomStore = null;
      errorMessage = '';
      dispatch('show', 'rooms');
    } catch (e) {
      errorMessage = 'Error leaving room: ' + e.message;
    }
  }

  function toggleAudio() {
    $audioOnStore = !$audioOnStore;
    enableTrack('audio', $audioOnStore);
  }

  function toggleVideo() {
    videoOn = !videoOn;
    enableTrack('video', videoOn);
  }

</script>

<section class="room">
  <h2>
    <span>{currentRoomName} Room</span>
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
      on:click={() => (shareScreen = !shareScreen)}
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
      on:click={() => (handRaised = !handRaised)}
    >
      <Icon icon={faHandPaper} />
    </button>
  </div>

  <div id="video-grid" bind:this={videoGrid} />
</section>

<style>
  button.off :global(.fa-svelte) {
    color: lightgray;
  }
  h2 {
    display: flex;
    align-items: center;
  }

  h2 > button {
    margin-left: 1rem;
  }

  .room {
    padding: 2rem;
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
