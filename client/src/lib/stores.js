import {writable} from 'svelte/store';

function persist(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function writableSession(key, initialValue) {
  const sessionValue = JSON.parse(sessionStorage.getItem(key));
  if (!sessionValue) persist(key, initialValue);

  const store = writable(sessionValue || initialValue);
  store.subscribe(value => persist(key, value));
  return store;
}

export const audioOnStore = writable(false);
export const busyStore = writable(false);
export const currentRoomStore = writableSession('current-room', null);
export const darkModeStore = writable(false);
export const emailStore = writableSession('email', 'r.mark.volkmann@gmail.com');
export const roomsStore = writableSession('rooms', {});
