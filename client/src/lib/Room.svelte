<script>
  import Icon from 'fa-svelte';
  import {faDoorClosed} from '@fortawesome/free-solid-svg-icons';
  import {createEventDispatcher} from 'svelte';
  import {currentRoom} from './stores.js';

  const dispatch = createEventDispatcher();
  let videoGrid;

</script>

<h2>Room</h2>

<div>You are in room {$currentRoom}.</div>

<button class="bare" on:click={() => dispatch('show', 'rooms')}>
  <Icon icon={faDoorClosed} />
</button>

<div id="video-grid" bind:this={videoGrid} />

<style>
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
