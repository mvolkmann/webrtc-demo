# webrtc-demo

This is based on the YouTube video by Kyle Cook (WebDevSimplified)
at <https://www.youtube.com/watch?v=DvlyzDZDEq4>.

A Node.js server based on Express, peerjs, and WebSockets
is implemented in the server directory.
Express is used to implement REST services
for managing rooms and their participants.
The peerjs package which provides client functionality for using WebRTC.
WebSockets are used to provide two-way communication
between the server and all the web clients.

To start this server, cd to that directory and enter `npm start`.
This server listens for http requests on port 1234.

The media streams (audio and video) communicate directly between the clients.
The data does not pass through the server.
This means that once clients have been connected,
the server can be stopped and the clients can continue communicating.

The web UI is built on Svelte.
To run it in development mode,
cd to the client directory,
enter `npm run dev`,
and browse localhost:3000 from multiple browsers.
To run it in production mode,
cd to the client directory,
enter `npm run build`,
and browse localhost:1234 from multiple browsers.

To run the UI on another device on the same WIFI network,
enter `ifconfig` in a terminal and note the en0 inet address.
Then replace localhost with that IP address.

To create the database:

- install SQLite
- `cd server`
- `sqlite3 webrtc.db < schema.txt`
