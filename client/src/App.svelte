<script>
  import Button from './lib/Button.svelte';
  import Login from './lib/Login.svelte';
  import Room from './lib/Room.svelte';
  import Rooms from './lib/Rooms.svelte';

  //import {v4 as uuidv4} from 'uuid';

  // Every user gets a unique roomId to start.
  //let roomId = uuidv4();

  const componentMap = {
    login: Login,
    room: Room,
    rooms: Rooms
  };

  let component = Login;

  function logout() {
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
