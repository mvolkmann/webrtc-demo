import {taskEnd, taskStart} from './Spinner.svelte';
//import {sleep} from './util';

let csrf;

setUrlPrefix();

export async function deleteResource(path) {
  taskStart();
  const body = JSON.stringify({csrf});
  const headers = {'Content-Type': 'application/json'};
  const url = getUrl(path);
  try {
    const res = await fetch(url, getOptions({method: 'DELETE', headers, body}));
    if (!res.ok) {
      const {status, statusText} = res;
      const message =
        status === 404
          ? 'DELETE ' + path + ' service not found'
          : `${statusText} (${status}) ${await res.text()}`;
      throw message;
    }
  } finally {
    taskEnd();
  }
}

/*
function getCookies() {
  const cookies = {};
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const [key, value] = part.split('=');
    cookies[key.trim()] = value;
  }
  return cookies;
}
*/

export async function getJson(path) {
  taskStart();
  //await sleep(2000); // simulate long-running task
  try {
    const res = await fetch(getUrl(path), getOptions());
    if (!res.ok) throw new Error(await getMessage(res));
    return handleResponse(res);
  } finally {
    taskEnd();
  }
}

async function getMessage(res) {
  let message = await res.text();
  if (message.startsWith('{') || message.startsWith('[')) {
    message = JSON.parse(message);
  }
  return message || `${res.statusText} (${res.status})`;
}

function getOptions(options = {}) {
  const token = sessionStorage.getItem('token');

  if (!options.headers) options.headers = {};
  options.headers['Access-Control-Allow-Origin'] = getUrlPrefix();
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  //options.headers['Sec-Fetch-Mode'] = 'cors';
  //options.credentials = 'include';

  return options;
}

function getUrl(path) {
  return path.startsWith('http') ? path : getUrlPrefix() + '/' + path;
}

function getUrlPrefix() {
  return sessionStorage.getItem('url-prefix');
}

async function handleJson(method, path, payload) {
  //getTokenFromCookie('token');

  taskStart();
  //await sleep(2000); // simulate long-running task

  try {
    //payload.csrf = csrf;
    const body = JSON.stringify(payload);
    const res = await fetch(
      getUrl(path),
      getOptions({
        body,
        headers: {'Content-Type': 'application/json'},
        method
      })
    );
    if (res.ok) return handleResponse(res);

    const {status} = res;
    const message =
      status === 401
        ? 'Invalid email or password'
        : status === 404
        ? method + ' ' + path + ' service not found'
        : await getMessage(res);
    throw message;
  } finally {
    taskEnd();
  }
}

async function handleResponse(res) {
  const contentType = res.headers.get('Content-Type') || '';
  return contentType.startsWith('application/json')
    ? res.json()
    : contentType.startsWith('text/')
    ? res.text()
    : res;
}

export const patchJson = (path, payload) => handleJson('PATCH', path, payload);

export const postJson = (path, payload) => handleJson('POST', path, payload);

export async function postMultipartJson(path, data) {
  taskStart();

  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value);
  }
  const options = getOptions({
    body: formData,
    method: 'POST'
  });

  try {
    const res = await fetch(getUrl(path), options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    return res;
  } finally {
    taskEnd();
  }
}

export const putJson = async (path, payload) =>
  handleJson('PUT', path, payload);

async function setUrlPrefix() {
  if (!sessionStorage.getItem('url-prefix')) {
    const urlPrefix = import.meta.env.VITE_API_ROOT_URL;
    sessionStorage.setItem('url-prefix', urlPrefix);
  }
}
