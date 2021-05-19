# webrtc-demo

This is based on the YouTube video by Kyle Cook (WebDevSimplified)
at <https://www.youtube.com/watch?v=DvlyzDZDEq4>.

Two servers must be started to run this app.

A Node.js server based on Express, peerjs, and WebSockets
is implemented in the server directory.
Express is used to implement REST services
for managing rooms and their participants.
The peerjs package which provides client functionality for using WebRTC.
WebSockets are used to provide two-way communication
between the server and all the web clients.

To start this server, cd to that directory and enter `npm start`.

The media streams (audio and video) communicate directly between the clients.
The data does not pass through the server.
This means that once clients have been connected,
the server can be stopped and the clients can continue communicating.

There are currently two versions of a web UI.
The first uses EJS to render HTML from the Express server.
To see this UI, browse `localhost:1234` from multiple browsers.

Change the room id at the end of the URL in order for two clients
to chat in the same room!

The other version of the web UI uses Svelte.
To start the Svelte web UI server, enter `npm run dev`.
Then browse `localhost:3000` from multiple browsers.
