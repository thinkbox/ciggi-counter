// Talks to the Express API. `fetch` is the browser's HTTP function.
// `async` / `await` mean "wait for the response before continuing".

import { requestAllowingClose } from "./logic.js";

async function request(path, body, method) {
  return fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function postAllowingClose(path, body, method) {
  return requestAllowingClose(path, body, method, {
    request,
    confirm: (message) => window.confirm(message),
  });
}

export async function sendJson(method, path, body) {
  const res = await request(path, body, method);
  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;
    try {
      const data = JSON.parse(text);
      if (data.error) message = data.error;
    } catch {
      // Body was not JSON. Show the raw text.
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function getJson(path) {
  return sendJson("GET", path);
}
