import * as constants from './constants.js'
import { Display } from './display.js';
import { Game } from './game.js'
import { PlayerControl } from './PlayerControl.js'

let loading = document.getElementById('loader');

let settingsVisible = false;
document.getElementById('settings').addEventListener("click", function() {
    settingsVisible = !settingsVisible;
    if (settingsVisible) {
        document.getElementById("settingsMenu").style.visibility = 'visible'
    } else {
        document.getElementById("settingsMenu").style.visibility = 'hidden'
    }
});


let game = {};
let display = {};
let otherPieces = {};
let user = {};
let playerControl = {};
let otherUsers = [];

let userBox = document.getElementById('user');
let otherUsersBox = document.getElementById('otherUsers');

const socket = io();

/**
 * Run when the user first connects to socket.
 */
socket.once('setupUser', setupDetails => {
    // set user details
    user.id = setupDetails.userDetails.id;
    user.name = setupDetails.userDetails.name;
    user.symbol = setupDetails.userDetails.symbol;

    // get other users
    otherUsers = setupDetails.currentUsers.filter(checkUser => checkUser.id != user.id);
    
    // create new game
    game = new Game(setupDetails.board.boardArray);
    game.gameOver = setupDetails.board.gameOver;

    // get current piece positions of other users
    for (const [id, userPiece] of Object.entries(setupDetails.board.piecePositions)) {
        otherPieces[id] = {
            tiles: userPiece.tiles,
            color: constants.PUBLIC_COLORS[userPiece.symbol] 
        }
    }

    // set current user div
    if (userBox != null) {
        userBox.innerHTML = `<div>${user.name} (You)</div><div>0</div>`;
        userBox.style.backgroundColor = constants.COLORS[user.symbol]
    }

    // set other user divs
    otherUsers.forEach(otherUser => {
        let otherUserDiv = document.createElement('div'); 
        otherUserDiv.classList.add('userBox');
        otherUserDiv.innerHTML = `<div>${otherUser.name}</div><div>${otherUser.score}</div>`
        otherUserDiv.style.backgroundColor = constants.COLORS[otherUser.symbol];

        if (otherUsersBox != null) {
            otherUsersBox.appendChild(otherUserDiv);
        }
    });

    display = new Display();

    playerControl = new PlayerControl(document, game, display, socket, otherPieces, user);

    playerControl.updateDisplayBoard();
    display.updatePreview(game);
    
    // if game is already over when user joins, display lose message
    if (game.gameOver) {
        document.getElementById('boardOverlay').innerHTML = `${setupDetails.board.latestLoser} lost the game :C`
        loading.style.visibility = 'visible';
    } else {
        // emit your position (starting position)
        socket.emit('movePiece', {
            id: user.id,
            tiles: game.getCurrentPiece().getTiles(),
            symbol: user.symbol
        });
    }
});


socket.on('boardUpdate', boardArray => {
    game.setBoard(boardArray);

    // if other player places piece which makes current one invalid, have to
    // push up to a valid position
    let initialPosition = game.getCurrentPosition();

    game.getCurrentPiece().liftToValidPosition();

    // if piece was pushed up, emit new piece position
    if (game.checkPieceMoved(initialPosition)) {
        socket.emit('movePiece', {
            id: user.id,
            tiles: game.getCurrentPiece().getTiles(),
            symbol: user.symbol
        });
    }
    
    // check if game over due to piece being pushed up
    if (game.gameOver) {
        document.getElementById('boardOverlay').innerHTML = `${user.name} lost the game :C`

        loading.style.visibility = 'visible';

        display.dimBoard();
        socket.emit('playerLost', user.name);
    }

    playerControl.updateDisplayBoard();
});

socket.on('pieceUpdate', userPiece => {
    // update position of piece
    otherPieces[userPiece.id] = {
        tiles: userPiece.tiles,
        color: constants.PUBLIC_COLORS[userPiece.symbol] 
    }

    playerControl.updateDisplayBoard();
})

socket.on('usersUpdate', users => {
    otherUsers = users.filter(checkUser => checkUser.id != user.id);
    otherUsersBox.innerHTML = '';
    // set other users
    otherUsers.forEach(otherUser => {
        let otherUserDiv = document.createElement('div'); 
        otherUserDiv.classList.add('userBox');
        otherUserDiv.innerHTML = `<div>${otherUser.name}</div><div>${otherUser.score}</div>`
        otherUserDiv.style.backgroundColor = constants.COLORS[otherUser.symbol];

        if (otherUsersBox != null) {
            otherUsersBox.appendChild(otherUserDiv);
        }
    });
    
})

socket.on('userDisconnect', id => {
    delete otherPieces[id];

    // otherUsers array is updated serverside

    playerControl.updateDisplayBoard();
})

socket.on('gameOver', name => {
    game.gameOver = true;
    
    document.getElementById('boardOverlay').innerHTML = `${name} lost the game :C`;

    loading.style.visibility = 'visible';
    display.dimBoard();
})


socket.on('startGame', board => {
    loading.style.visibility = 'hidden';
    document.getElementById('boardOverlay').innerHTML = '';

    // reset variables
    game.gameOver = false;
    game.setBoard(board.boardArray);
    game.getCurrentPiece().resetPosition();


    playerControl.updateDisplayBoard();
    display.updatePreview(game);

    playerControl.restartGameTimers();

    // emit your position
    socket.emit('movePiece', {
        id: user.id,
        tiles: game.getCurrentPiece().getTiles(),
        symbol: user.symbol
    });
})