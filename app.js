import express from "express";
import * as path from 'path'
import { createServer } from 'http';
import { Server } from "socket.io";
import { Users } from "./utils/users.js";
import { Board } from "./utils/board.js";


const app = express();
const server = createServer(app);
const io = new Server(server);

// Set static folder
app.use(express.static(path.join(path.resolve(), 'frontend')))

// Set up Users
let users = new Users();
let globalBoard = new Board();

// Run when client connects
io.on('connection', socket => {
    console.log('New WS connection');

    let user = users.addUser(socket.id);

    socket.emit('setupUser', {
        userDetails:user,

        board:globalBoard,

        currentUsers:users.users
    });
    

    // let other users know user joined
    socket.broadcast.emit('usersUpdate', users.users);

    socket.on('placePiece', placeInformation => {
        if (globalBoard.gameOver) {
            return;
        }

        let freeTiles = globalBoard.getFreeTiles(placeInformation.tiles);
        globalBoard.setTiles(freeTiles, user.symbol);
        globalBoard.clearLines();



        // globalBoard.boardArray = placeInformation.boardArray;
        io.emit('boardUpdate', globalBoard.boardArray);
    })

    socket.on('movePiece', userPiece => {
        if (globalBoard.gameOver) {
            return;
        }

        globalBoard.piecePositions[userPiece.id] = {
            tiles: userPiece.tiles,
            symbol: userPiece.symbol
        };



        socket.broadcast.emit('pieceUpdate', userPiece);
    })

    socket.on('clearedLines', clearDetails => {
        if (globalBoard.gameOver) {
            return;
        }

        let clearedUser = users.getUser(clearDetails.id);
        clearedUser.score = clearDetails.totalLines;

        users.sortUsers();
        
        socket.broadcast.emit('usersUpdate', users.users);
    })

    socket.on('playerLost', name => {
        globalBoard.gameOver = true;
        globalBoard.latestLoser = name;
        io.emit('gameOver', name);

        setTimeout(() => {
            // initialise new board array
            globalBoard.boardArray = globalBoard.generateEmptyBoard();
            globalBoard.piecePositions = {};
            globalBoard.gameOver = false;

            io.emit('startGame', globalBoard);
        }, 5000);
    });


    // Runs when client disconnects
    socket.on('disconnect', () => {
        users.removeUser(socket.id);

        // update usersBox
        socket.broadcast.emit('usersUpdate', users.users);

        // remove piece from board
        delete globalBoard.piecePositions[socket.id];

        socket.broadcast.emit('userDisconnect', socket.id);
    })
})

// Run server on port
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));