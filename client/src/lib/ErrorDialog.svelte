<script context="module">
  let dialog;

  export function reportError(message) {
    dialog.querySelector('.body').textContent = message;
    dialog.showModal();
  }
</script>

<script>
  import Dialog from './Dialog.svelte';
</script>

<Dialog className="error-dialog" title="Error" bind:dialog />

<style>
  :global(.error-dialog > header) {
    background-color: var(--error-color);
  }
</style>
