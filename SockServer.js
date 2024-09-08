const WebSocket = require('ws');

try {
  // Attempt to start the WebSocket server
  const wss = new WebSocket.Server({ port: 8080 });

  // Check for errors when the server starts
  wss.on('error', (error) => {
    console.error('WebSocket server failed to start:', error.message);
    process.exit(1); // Exit the process in case of failure
  });

  // If the server starts successfully, log a message
  wss.on('listening', () => {
    console.log('WebSocket server is running on port 8080.');
  });

  wss.on('connection', function connection(ws) {
    console.log('New client connected.');

    // Handle messages from the client
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
      // Echo the received message back to the client
      ws.send(`Server received: ${message}`);
    });

    // Handle connection close
    ws.on('close', () => {
      console.log('Client disconnected.');
    });

    // Handle client-side errors
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error.message);
    });

    // Send a welcome message when the connection is established
    ws.send('Welcome to the WebSocket server!');
  });

} catch (error) {
  console.error('Failed to start the WebSocket server:', error.message);
  process.exit(1); // Exit the process if the server setup fails
}
