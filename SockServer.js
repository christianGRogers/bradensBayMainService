const WebSocket = require('ws');
const net = require('net');




try {
  const websock = new WebSocket.Server({ port: 8080 });
  websock.on('error', (error) => {
    console.error('WebSocket server failed to start:', error.message);
  });

  websock.on('listening', () => {
    console.log('WebSocket server is running on port 8080.');
  });
  websock.on('connection', function connection(ws) {
    console.log('New client connected.');
    console.log('open a new tcp connection to n1');
    const tcpsock = net.createConnection({ port: 8081, host: '10.0.0.11' }, () => {
      console.log('Connected to server');
    });
    tcpsock.on('data', (data) => {
      console.log('Data from server: ' + data.toString());
      websock.write(data);
    });
    
    tcpsock.on('end', () => {
      console.log('Disconnected from server');
    });
    tcpsock.on('error', (error) => {
      console.error('Failed to connect to tcp server:', error.message);
    });
    websock.on('message', function incoming(message) {
      console.log('received: %s', message);
      tcpsock.write(message);
    });

    websock.on('close', () => {
      console.log('Client disconnected.');
    });
    websock.on('error', (error) => {
      console.error('WebSocket client error:', error.message);
    });

  });

} catch (error) {
  console.error('Failed to start the WebSocket server:', error.message);
  
}
