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
  import {createEventDispatcher} from 'svelte';
  import {currentRoom} from './stores.js';

  const dispatch = createEventDispatcher();

  let audioOn = false;
  let chat = false;
  let handRaised = false;
  let screenSharingOn = false;
  let shareScreen = false;
  let videoGrid;
  let videoOn = false;

</script>

<section class="room">
  <h2>
    <span>{$currentRoom} Room</span>
    <button
      class="bare"
      title="leave room"
      on:click={() => dispatch('show', 'rooms')}
    >
      <Icon icon={faDoorClosed} />
    </button>
  </h2>

  <div class="buttons">
    <button
      class={'bare' + (audioOn ? '' : ' off')}
      title="turn on audio"
      on:click={() => (audioOn = !audioOn)}
    >
      <Icon icon={faMicrophone} />
    </button>
    <button
      class={'bare' + (videoOn ? '' : ' off')}
      title="turn on video"
      on:click={() => (videoOn = !videoOn)}
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
