<script>
  import {deleteResource} from './lib/fetch-util.js';
  import Button from './lib/Button.svelte';
  import Login from './lib/Login.svelte';
  import Room from './lib/Room.svelte';
  import Rooms from './lib/Rooms.svelte';
  import {currentRoomStore, emailStore, roomsStore} from './lib/stores.js';

  const componentMap = {
    login: Login,
    room: Room,
    rooms: Rooms
  };

  let component = Login;
  let errorMessage = '';

  //TODO: Most of this code is duplicated in Room.svelte.
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
      component = Login;
    } catch (e) {
      errorMessage = 'Error leaving room: ' + e.message;
    }
  }

  function logout() {
    leaveRoom();
    component = Login;
  }

  function show(event) {
    component = componentMap[event.detail];
  }
</script>

<main>
  <h1>
    <div>WebRTC Demo</div>
    {#if component !== Login}
      <Button reverse on:click={logout}>Logout</Button>
    {/if}
  </h1>

  {#if errorMessage}
    <div class="error">{errorMessage}</div>
  {/if}

  <svelte:component this={component} on:show={show} />
</main>

<style>
  h1 {
    background-color: var(--secondary-color);
    color: white;
    display: flex;
    justify-content: space-between;
    padding: 2rem;
  }
</style>
