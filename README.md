# webrtc-demo

This is based on the YouTube video by Kyle Cook (WebDevSimplified)
at <https://www.youtube.com/watch?v=DvlyzDZDEq4>.

Note that three servers must be started to run this app!

This app uses the "peerjs" npm package which provides
client functionality for using WebRTC.
It also uses the "peer" npm package
which implements a server for peerjs.
This server is used to establish connections between peerjs clients.

To start the peer server, enter `npm run peer`.

This app uses Express and Socket.io to implement a server.
To start the Express server, enter `npm start`.

The purpose of the server is to create "rooms" and
allow clients to discover and connect to each other.
The media streams communicate directly between the clients.
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
