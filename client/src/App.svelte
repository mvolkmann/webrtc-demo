<script>
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

  function show(componentName) {
    component = componentMap[componentName];
  }
</script>

<main>
  <h1>WebRTC Demo</h1>
  <svelte:component this={component} on:show={show} />
</main>

<style>
</style>
