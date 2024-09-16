const WebSocket = require('ws');
const net = require('net');
const https = require('https');
const fs = require('fs');

try {
  // Load SSL certificates
  const server = https.createServer({
    cert: fs.readFileSync('/etc/ssl/certs/ssl-cert-snakeoil.pem'),  // Path to your SSL certificate
    key: fs.readFileSync('/etc/ssl/private/ssl-cert-snakeoil.key')     // Path to your SSL private key
  });

  // Create the WebSocket server using WSS (WebSocket over HTTPS)
  const websock = new WebSocket.Server({ server });

  websock.on('error', (error) => {
    console.error('WebSocket server failed to start:', error.message);
  });

  websock.on('listening', () => {
    console.log('WSS WebSocket server is running.');
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

  // Start the HTTPS server
  server.listen(8080, () => {
    console.log('WSS server listening on port 8080');
  });

} catch (error) {
  console.error('Failed to start the WebSocket server:', error.message);
}
