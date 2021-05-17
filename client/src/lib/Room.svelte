<script>
  import {back} from './util.js';

  export let roomId;

  let videoGrid;
</script>

<h2>Room</h2>
<div>You are in room {roomId}.</div>
<button on:click={back}>Exit</button>
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
