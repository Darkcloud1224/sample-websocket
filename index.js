'use strict';
const WebSocket = require('ws');

// Dictionary to store connected clients in their respective rooms
const rooms = {};

const wss = new WebSocket.Server({ port: 8765 });

wss.on('connection', function (ws) {
  ws.on('message', async function (message) {
    const room_id = message;
    
    // Create the room if it doesn't exist
    if (!rooms[room_id]) {
      rooms[room_id] = new Set();
    }

    // Add the client to the room
    rooms[room_id].add(ws);
    console.log(`Client joined room ${room_id}`);

    try {
      // Handle incoming messages from the client
      ws.on('message', async function (message) {
        // Broadcast the message to all clients in the room
        for (let client of rooms[room_id]) {
          if (client !== ws) { // Don't send the message back to the sender
            client.send(message);
            console.log(`Message broadcasted in room ${room_id}: ${message}`);
          }
        }
      });

      // Periodically send messages to the client (optional)
      const intervalId = setInterval(function () {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(process.memoryUsage()), function () {
            // Ignore errors
          });
        }
      }, 100);

      // Handle client disconnection
      ws.on('close', function () {
        console.log(`Client left room ${room_id}`);
        rooms[room_id].delete(ws);
        clearInterval(intervalId); // Stop sending messages on disconnect
      });

    } catch (error) {
      console.error(`WebSocket error: ${error.message}`);
    }
  });
});

console.log('WebSocket server is listening on ws://localhost:8765');
