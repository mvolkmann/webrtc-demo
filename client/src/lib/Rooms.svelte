<script>
  import Icon from 'fa-svelte';
  import {
    faDoorOpen,
    faPlus,
    faTrashAlt
  } from '@fortawesome/free-solid-svg-icons';
  import {createEventDispatcher} from 'svelte';

  import ConfirmDialog from './ConfirmDialog.svelte';
  import {currentRoom, rooms} from './stores.js';

  const dispatch = createEventDispatcher();

  let deleteDialog;
  let roomName;
  let roomToDelete;

  //TODO: Just for testing.
  $rooms = ['React', 'Svelte'];

  function addRoom() {
    rooms.update(roomNames => {
      roomNames.push(roomName);
      return roomNames;
    });
  }

  function confirmDeleteRoom(roomName) {
    roomToDelete = roomName;
    deleteDialog.showModal();
  }

  function deleteRoom() {
    rooms.update(roomNames => {
      return roomNames.filter(name => name !== roomToDelete);
    });
  }

  function joinRoom(roomName) {
    $currentRoom = roomName;
    dispatch('show', 'room');
  }

</script>

<h2>Rooms</h2>

<form class="row" on:submit|preventDefault={addRoom}>
  <label for="room-name">New Room</label>
  <input id="room-name" required bind:value={roomName} />
  <button class="bare" disabled={!roomName}>
    <Icon icon={faPlus} />
  </button>
</form>

{#each $rooms as roomName}
  <div class="row">
    <span class="room-name">{roomName}</span>
    <button class="bare" on:click={() => joinRoom(roomName)}>
      <Icon icon={faDoorOpen} />
    </button>
    <button class="bare" on:click={() => confirmDeleteRoom(roomName)}>
      <Icon icon={faTrashAlt} />
    </button>
  </div>
{:else}
  <div>There are no rooms to show yet.</div>
{/each}

<ConfirmDialog
  bind:dialog={deleteDialog}
  question="Are you sure you want to delete the room?"
  on:ok={deleteRoom}
/>

<style>
  .bare {
    margin-left: 1rem;
  }

  .room-name {
    color: purple;
    font-size: 1.2rem;
    font-weight: bold;
  }

</style>
