const WebSocket = require('ws');
const net = require('net');




try {
  const wss = new WebSocket.Server({ port: 8080 });
  wss.on('error', (error) => {
    console.error('WebSocket server failed to start:', error.message);
    process.exit(1); 
  });

  wss.on('listening', () => {
    console.log('WebSocket server is running on port 8080.');
  });
  wss.on('connection', function connection(ws) {
    console.log('New client connected.');
    console.log('open a new tcp connection to n1');
    const client = net.createConnection({ port: 8081 }, () => {
      console.log('Connected to server');
      client.write('Hello from client!');
    });
    client.on('data', (data) => {
      console.log('Data from server: ' + data.toString());
      client.end();
    });
    
    client.on('end', () => {
      console.log('Disconnected from server');
    });
    
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
      ws.send(`Server received: ${message}`);
    });
    ws.on('close', () => {
      console.log('Client disconnected.');
    });
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error.message);
    });

  });

} catch (error) {
  console.error('Failed to start the WebSocket server:', error.message);
  process.exit(1); 
}
