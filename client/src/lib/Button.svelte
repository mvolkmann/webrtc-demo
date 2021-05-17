<script>
  export let ariaLabel = '';
  export let asLink = false;
  export let bare = false;
  export let className = '';
  export let dataTestId = '';
  export let disabled = false;
  export let element = null;
  export let id = '';
  export let reverse = false;
  export let style = '';
  export let title = '';
  export let type = 'button'; // not 'submit'

  let optionalProps = {};
  if (id) optionalProps.id = id;

  $: classes =
    (asLink ? ' as-link' : '') +
    (bare ? ' bare' : '') +
    (reverse ? ' reverse' : '') +
    (className ? ' ' + className : '');
</script>

<button
  aria-label={ariaLabel}
  bind:this={element}
  class={classes}
  data-testid={dataTestId}
  {disabled}
  on:click
  {style}
  {title}
  {type}
  {...optionalProps}
>
  <slot />
</button>

<style>
  .as-link {
    background-color: transparent;
    border: none !important;
    color: var(--label-color);
    padding-left: 0;
    padding-right: 0;
    text-decoration: underline;
    text-transform: none;
  }

  .bare {
    background-color: transparent;
    border: none;
    color: var(--text-color);
    margin: 0;
    outline: none;
    padding: 0;
  }

  .bare :global(svg) {
    color: var(--input-fg-color);
    margin-right: 0;
  }
</style>
