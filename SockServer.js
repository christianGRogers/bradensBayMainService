const WebSocket = require('ws');
const net = require('net');
const axios = require('axios'); // Using axios for simplicity

try {
  const websock = new WebSocket.Server({ port: 8080 });

  websock.on('error', (error) => {
    console.error('WebSocket server failed to start:', error.message);
  });

  websock.on('listening', () => {
    console.log('WebSocket server is running on port 8080.');
  });

  // Handle WebSocket client connections
  websock.on('connection', async function connection(ws) {
    console.log('New WebSocket client connected.');

    let tcpsock = null;
    let VMnameRec = false; // To track if the VM name has been received

    ws.on('close', () => {
      console.log('WebSocket client disconnected.');
      if (tcpsock) {
        tcpsock.end(); // Close TCP connection when WebSocket client disconnects
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket client error:', error.message);
      if (tcpsock) {
        tcpsock.end(); // Close TCP connection on error
      }
    });

    ws.on('message', async function incoming(message) {
      console.log('Received from WebSocket client: %s', message);

      if (VMnameRec) {
        // Forward message to the TCP server once VM name is received
        if (tcpsock) {
          tcpsock.write(message); // Send WebSocket message to TCP server
        } else {
          console.error('No TCP connection established.');
        }
      } else {
        // If the VM name is not yet received, treat the message as VM name
        console.log('Sending POST request with VM name...');
        const postData = {
          vm: message
        };

        try {
          const response = await axios.post('http://10.0.0.11:8081', postData); 
          console.log('POST request successful. Response:', response.data);
          VMnameRec = true;

          // Now open a new TCP connection
          console.log('Opening a new TCP connection to n1...');
          tcpsock = net.createConnection({ port: 8081, host: '10.0.0.11' }, () => {
            console.log('Connected to TCP server');
          });

          tcpsock.on('data', (data) => {
            console.log('Data from TCP server: ' + data.toString());
            ws.send(data); // Send TCP server data back to WebSocket client
          });

          tcpsock.on('end', () => {
            console.log('Disconnected from TCP server');
          });

          tcpsock.on('error', (error) => {
            console.error('Failed to connect to TCP server:', error.message);
            ws.send('Error: Failed to connect to TCP server.');
          });
        } catch (postError) {
          console.error('POST request failed:', postError.message);
          ws.send('Error: Failed to send POST request.');
        }
      }
    });
  });

} catch (error) {
  console.error('Failed to start the WebSocket server:', error.message);
}
