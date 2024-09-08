const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
console.log('Server started');
wss.on('connection', function connection(ws) {
   console.log('New client connected.');

   // Handle messages from the client
   ws.on('message', function incoming(message) {
      console.log('received: %s', message);
      // Echo the received message back to the client
      ws.send(`Server received: ${message}`);
   });

   // Send a message when the connection is established
   ws.send('Welcome to the WebSocket server!');
});
