<script>
  import {createEventDispatcher} from 'svelte';
  import Button from './Button.svelte';
  import Dialog from './Dialog.svelte';

  export let dialog;
  export let question;

  const dispatch = createEventDispatcher();

  function cancel() {
    dialog.close();
    dispatch('cancel');
  }

  function ok() {
    dialog.close();
    dispatch('ok');
  }
</script>

<Dialog title="Confirm" bind:dialog>
  {@html question}
  <div class="buttons">
    <Button on:click={cancel}>Cancel</Button>
    <Button on:click={ok}>OK</Button>
  </div>
</Dialog>

<style>
  .buttons {
    display: flex;
    align-items: center;
  }

  .buttons > :global(button) {
    color: var(--input-bg-color);
  }

  .buttons > :global(button:not(:first-of-type)) {
    margin-left: 1rem;
  }
</style>
