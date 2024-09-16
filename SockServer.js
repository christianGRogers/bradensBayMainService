const WebSocket = require('wss');
const net = require('net');

try {
  const websock = new WebSocket.Server({ port: 8080 });

  websock.on('error', (error) => {
    console.error('WebSocket server failed to start:', error.message);
  });

  websock.on('listening', () => {
    console.log('WebSocket server is running on port 8080.');
  });

  // Handle WebSocket client connections
  websock.on('connection', function connection(ws) {
    console.log('New WebSocket client connected.');

    // Create a TCP connection for each WebSocket client
    const tcpsock = net.createConnection({ port: 8081, host: '10.0.0.11' }, () => {
      console.log('Connected to TCP server');
    });

    
    ws.on('message', function incoming(message) {
      console.log('Received from WebSocket client: %s', message);

      if (tcpsock) {
        // Send WebSocket message to the TCP server
        tcpsock.write(message, (err) => {
          if (err) {
            console.error('Error writing to TCP server:', err.message);
          }
        });
      }
    });

    // Forward data from the TCP server back to the WebSocket client
    tcpsock.on('data', (data) => {
      console.log('Data from TCP server: ' + data.toString());
      ws.send(data); // Send TCP server data back to WebSocket client
    });

    // Handle WebSocket client disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected.');
      if (tcpsock) {
        tcpsock.end(); // Close TCP connection when WebSocket client disconnects
      }
    });

    // Handle WebSocket client error
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error.message);
      if (tcpsock) {
        tcpsock.end(); // Close TCP connection on WebSocket error
      }
    });

    // Handle TCP connection errors
    tcpsock.on('error', (error) => {
      console.error('Failed to connect to TCP server:', error.message);
      ws.send('Error: Failed to connect to TCP server.');
    });

    // Handle TCP server disconnection
    tcpsock.on('end', () => {
      console.log('Disconnected from TCP server');
    });
  });

} catch (error) {
  console.error('Failed to start the WebSocket server:', error.message);
}
