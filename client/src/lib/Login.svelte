<script>
  import {createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();
  let email;
  let password;

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
  <button>Login</button>
</form>

<style>
  button {
    margin-left: calc(var(--label-width) + var(--label-margin));
  }

  form {
    --label-margin: 0.5rem;
    --label-width: 5rem;
  }

  label {
    margin-right: var(--label-margin);
    text-align: right;
    width: var(--label-width);
  }

</style>
