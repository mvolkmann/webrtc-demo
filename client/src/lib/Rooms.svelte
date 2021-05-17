<script>
  // @ts-nocheck

  import Icon from 'fa-svelte';
  import {
    faDoorOpen,
    faPlus,
    faTrashAlt
  } from '@fortawesome/free-solid-svg-icons';
  import {createEventDispatcher, onMount} from 'svelte';

  import ConfirmDialog from './ConfirmDialog.svelte';
  import {deleteResource, getJson, postJson} from './fetch-util.js';
  import {currentRoomStore, emailStore, roomsStore} from './stores.js';
  import {sortCaseInsensitive} from './util.js';

  const dispatch = createEventDispatcher();

  let deleteDialog = null;
  let errorMessage;
  let roomName;
  let roomToDelete;

  onMount(loadRooms);

  function confirmDeleteRoom(room) {
    roomToDelete = room;
    deleteDialog.showModal();
  }

  async function createRoom() {
    const body = {name: roomName};
    try {
      const room = await postJson('room', body);
      roomsStore.update(theRooms => {
        theRooms[roomName] = room;
        return theRooms;
      });

      roomName = '';
      errorMessage = '';
    } catch (e) {
      errorMessage = 'Error adding room: ' + e.message;
    }
  }

  async function deleteRoom() {
    //TODO: Don't allow when there are participants.
    const {name} = roomToDelete;
    try {
      await deleteResource('room/' + name);
      roomsStore.update(theRooms => {
        delete theRooms[name];
        return theRooms;
      });
      errorMessage = '';
    } catch (e) {
      errorMessage = 'Error deleting room: ' + e.message;
    }
  }

  async function joinRoom(room) {
    const {name} = room;
    const email = $emailStore;
    try {
      const newRoom = await postJson(`room/${name}/participant`, {email});
      roomsStore.update(theRooms => {
        theRooms[name] = newRoom;
        return theRooms;
      });
      $currentRoomStore = newRoom;
      errorMessage = '';
      dispatch('show', 'room');
    } catch (e) {
      errorMessage = 'Error joining room: ' + e.message;
    }
  }

  async function loadRooms() {
    try {
      $roomsStore = await getJson('room');
    } catch (e) {
      errorMessage = 'Error getting rooms: ' + e.message;
    }
  }

</script>

<section class="rooms">
  <h2>Rooms</h2>

  {#if errorMessage}
    <div class="error">{errorMessage}</div>
  {/if}

  <form class="row" on:submit|preventDefault={createRoom}>
    <label for="room-name">New Room</label>
    <input id="room-name" required bind:value={roomName} />
    <button class="bare" disabled={!roomName}>
      <Icon icon={faPlus} />
    </button>
  </form>

  {#each sortCaseInsensitive(Object.values($roomsStore), 'name') as room}
    <div class="row">
      <span class="room-name">{room.name} ({room.participants.length})</span>
      <button class="bare" title="enter room" on:click={() => joinRoom(room)}>
        <Icon icon={faDoorOpen} />
      </button>
      <button
        class="bare"
        title="delete room"
        on:click={() => confirmDeleteRoom(room)}
      >
        <Icon icon={faTrashAlt} />
      </button>
    </div>
  {:else}
    <div class="row">No rooms have been created yet.</div>
  {/each}
</section>

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
    color: var(--input-fg-color);
    font-size: 1.2rem;
    font-weight: bold;
  }

  .rooms {
    padding: 2rem;
  }

</style>
