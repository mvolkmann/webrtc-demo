# webrtc-demo

This is a web app that supports sharing audio, video, and screens
in "rooms" between any number of users using [WebRTC](https://webrtc.org).
It is based on the YouTube video by Kyle Cook (WebDevSimplified)
at <https://www.youtube.com/watch?v=DvlyzDZDEq4>.

The media streams (audio and video) communicate directly between the clients.
The data does not pass through the server.
This means that once clients have been connected,
the server can be stopped and the clients can continue communicating.

A Node.js server based on Express, peerjs, and WebSockets
is implemented in the `server` directory.
Express is used to implement REST services
for managing rooms and their participants.
The peerjs package simplifies the use of WebRTC.
WebSockets are used to provide two-way communication
between the server and all the web clients.

To start the server, cd to the `server` directory and enter `npm start`.
This server listens for HTTP requests on port 1234.

The web UI is built using [Svelte](https://svelte.dev).
To run it in development mode,
cd to the `client` directory,
enter `npm run dev`,
and browse `localhost:3000` from multiple browsers.
To run it in production mode, cd to the client directory and
enter `npm run build` which writes files to the `client/dist` directory.
Then browse `localhost:1234` from multiple browsers.
The server serves static files found in the 'client/dist' directory.

To run the UI on another device on the same WiFi network,
enter `ifconfig` in a terminal and note the en0 inet address.
Then replace localhost with that IP address in the following files:

- `client/.env`
- TODO: Do you need to rebuild the client after this change?
- TODO: Do any other files need to be modified?

Information about users, rooms, and participants
are stored in a SQLite database.
The database schema is defined in `server/schema.txt`.

To create the database:

- install [SQLite](https://mvolkmann.github.io/blog/topics/#/blog/sqlite/)
- `cd server`
- `npm run db-reset`

To interactively query the database:

- `sqlite3 webrtc.db`
- enter ["Dot Commands"](https://mvolkmann.github.io/blog/topics/#/blog/sqlite/)
- To see a list of the tables, enter `.tables`.
- To see all the "room" records, enter `select * from room;`
- To see all the "participant" records, enter `select * from participant;`
