const WebSocket = require('ws');  // WebSocket library
const net = require('net');       // Node's TCP library

// Set up WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    // Connect to the TCP server (target server)
    const tcpClient = new net.Socket();
    tcpClient.connect(8081, '10.0.0.11', () => {
        console.log('Connected to TCP server');
    });

    // Handle messages from WebSocket client and forward to TCP server
    ws.on('message', (message) => {
        console.log('Received from WebSocket:', message);
        tcpClient.write(message);  // Forward WebSocket message to TCP server
    });

    // Handle data from the TCP server and send it back to WebSocket client
    tcpClient.on('data', (data) => {
        console.log('Received from TCP server:', data.toString());
        ws.send(data.toString());  // Send TCP server response back to WebSocket client
    });

    // Handle TCP client error
    tcpClient.on('error', (err) => {
        console.error('TCP client error:', err.message);
        ws.close();
    });

    // Handle WebSocket client error
    ws.on('error', (err) => {
        console.error('WebSocket error:', err.message);
        tcpClient.end();  // Close TCP connection if WebSocket closes
    });

    // Handle WebSocket close event
    ws.on('close', () => {
        console.log('WebSocket connection closed');
        tcpClient.end();  // Close TCP connection when WebSocket closes
    });
});
