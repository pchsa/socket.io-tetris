const express = require("express");
const path = require("path");
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server)

// Set static folder
app.use(express.static(path.join(__dirname, 'frontend')))

// Run when client connects
io.on('connection', socket => {
    console.log('New WS connection');

    socket.emit('message', 'Welcome to socket');
})

// Run server on port
const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));