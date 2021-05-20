<script context="module">
  import {busyStore} from './stores';

  const MIN_TIME_TO_DISPLAY = 1000;

  let busyCounter = 0;
  let startTime;

  export function taskEnd() {
    if (busyCounter > 0) busyCounter--;
    if (busyCounter === 0) {
      const timeDisplayed = Date.now() - startTime;
      // Wait to hide spinner until it has been
      // displayed for a minimum amount of time.
      const waitTime = Math.max(0, MIN_TIME_TO_DISPLAY - timeDisplayed);
      setTimeout(() => busyStore.set(false), waitTime);
    }
  }

  export function taskStart() {
    const alreadyBusy = busyCounter > 0;
    busyCounter++;

    if (!alreadyBusy) {
      // Wait a bit before showing spinner so
      // it never appears for short duration tasks.
      setTimeout(() => {
        startTime = Date.now();
        if (busyCounter > 0) busyStore.set(true);
      }, 200);
    }
  }
</script>

<script>
  import * as solid from '@fortawesome/free-solid-svg-icons';
  import {onMount} from 'svelte';
  import Icon from 'fa-svelte';
  import {getBodyCssVar} from './util';

  export let arcDegrees = 60;
  export let size = 100;
  export let strokeWidth = 10;

  const DELTA_DEGREES = -5;
  const LARGE_ARC = 0;
  const SWEEP = 0;
  const X_AXIS_ROTATION = 0;

  let fgColor;
  let pathD = '';
  let startDegrees = 0;
  let token = 0;

  $: halfSize = size / 2;
  $: halfStroke = strokeWidth / 2;
  $: radius = halfSize - halfStroke;

  onMount(() => {
    fgColor = getBodyCssVar('', 'white');
    token = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(token);
  });

  const warningColor =
    getComputedStyle(document.documentElement).getPropertyValue(
      '--warning-color'
    ) || 'red';

  function animate() {
    startDegrees = (startDegrees + DELTA_DEGREES) % 360;
    pathD = getPathD();
    token = requestAnimationFrame(animate);
  }

  const degreesToRadians = degrees => (degrees * Math.PI) / 180;

  function getPathD() {
    const startAngle = degreesToRadians(startDegrees);
    const endAngle = degreesToRadians(startDegrees + arcDegrees);

    const startX = halfSize + radius * Math.cos(startAngle);
    const startY = halfSize - radius * Math.sin(startAngle);
    const endX = halfSize + radius * Math.cos(endAngle);
    const endY = halfSize - radius * Math.sin(endAngle);

    const move = `M ${startX} ${startY}`;
    const arc = `A ${radius} ${radius} ${X_AXIS_ROTATION} ${LARGE_ARC} ${SWEEP} ${endX} ${endY}`;
    return move + ' ' + arc;
  }
</script>

{#if $busyStore}
  <div class="spinner" style={`--size: ${size}px`}>
    <svg class="progress" width={size} height={size}>
      <path
        fill="none"
        stroke={warningColor}
        stroke-width={strokeWidth}
        d={pathD}
      />
    </svg>
    <Icon color={fgColor} icon={solid.faCloudDownloadAlt} />
  </div>
{/if}

<style>
  .progress {
    box-sizing: border-box;
    height: var(--size);
    width: var(--size);

    position: absolute;
  }

  .spinner {
    display: flex;
    justify-content: center;
    align-items: center;

    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 400;

    background-color: var(--secondary-color);
    opacity: 0.7;
    border: solid var(--tertiary-color) 0.625rem;
    border-radius: calc(var(--size) / 2);
    box-sizing: border-box;
    height: var(--size);
    width: var(--size);
  }
  .spinner :global(.fa-svelte) {
    font-size: 3rem;
  }

  svg {
    color: var(--text-color);
    height: 40%;
    width: 40%;
  }
</style>
