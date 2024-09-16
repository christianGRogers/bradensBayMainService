const WebSocket = require('ws');
const net = require('net');
const http = require('http');
const axios = require('axios'); // Using axios for simplicity
var VMnameRec = false;

try {

  
  const websock = new WebSocket.Server({ port: 8080 });
  websock.on('error', (error) => {
    console.error('WebSocket server failed to start:', error.message);
  });

  websock.on('listening', () => {
    console.log('WebSocket server is running on port 8080.');
  });
        

  websock.on('connection', async function connection(ws) {
    console.log("new client");
    ws.on('close', () => {
      console.log('WebSocket client disconnected.');
    });
  
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error.message);
    });
    
    ws.on('message', function incoming(message) {
      console.log('Received from WebSocket client: %s', message);
      if(VMnameRec){
        tcpsock.write(message);
      }
      else{
        console.log("sending POST req");
        const postData = {
          vm: message
        };
        const response = axios.post('http://10.0.0.11:8081', postData); 
        console.log('POST request successful. Response:', response.data);
        VMnameRec = true;
      }
    });
    // try {

    //     console.log('Opening a new TCP connection to n1...');
    //     const tcpsock = net.createConnection({ port: 8081, host: '10.0.0.11' }, () => {
    //       console.log('Connected to TCP server');
    //     });
      


    //     tcpsock.on('end', () => {
    //       console.log('Disconnected from TCP server');
    //     });

    //     tcpsock.on('error', (error) => {
    //       console.error('Failed to connect to TCP server:', error.message);
    //     });
    //     tcpsock.on('data', (data) => {
    //       console.log('Data from TCP server: ' + data.toString());
    //       ws.send(data); 
    //     });


    //   } catch (error) {
    //     console.error('tcp error:', error.message);
    //   }


  });

} catch (error) {
  console.error('Failed to start the WebSocket server:', error.message);
}
