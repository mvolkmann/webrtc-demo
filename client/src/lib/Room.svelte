<script>
  import Icon from 'fa-svelte';
  import {faDoorClosed} from '@fortawesome/free-solid-svg-icons';
  import {createEventDispatcher} from 'svelte';
  import {currentRoom} from './stores.js';

  const dispatch = createEventDispatcher();
  let videoGrid;

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

  <div id="video-grid" bind:this={videoGrid} />
</section>

<style>
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
