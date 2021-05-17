<script>
  import {createEventDispatcher} from 'svelte';
  import Button from './Button.svelte';

  const dispatch = createEventDispatcher();
  let email = 'r.mark.volkmann@gmail.com';
  let password = 'secret';

  function login() {
    dispatch('show', 'rooms');
  }

</script>

<form on:submit|preventDefault={login}>
  <div class="row">
    <label for="email">Email</label>
    <input type="email" autocomplete="email" required bind:value={email} />
  </div>
  <div class="row">
    <label for="password">Password</label>
    <input
      type="password"
      autocomplete="current-password"
      required
      bind:value={password}
    />
  </div>
  <div class="row">
    <Button type="submit">Login</Button>
  </div>
</form>

<style>
  form {
    --label-width: 5rem;
    padding: 2rem;
  }

  form :global(button) {
    margin-left: calc(var(--label-width) + var(--label-margin));
  }

  input {
    width: 15rem;
  }

  label {
    margin-right: var(--label-margin);
    text-align: right;
    width: var(--label-width);
  }

</style>
