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

socket.once('setupUser', setupDetails => {
    user.id = setupDetails.userDetails.id;
    user.name = setupDetails.userDetails.name;
    user.symbol = setupDetails.userDetails.symbol;

    otherUsers = setupDetails.currentUsers.filter(checkUser => checkUser.id != user.id);
    

    game = new Game(setupDetails.board.boardArray);
    game.gameOver = setupDetails.board.gameOver;

    
    for (const [id, userPiece] of Object.entries(setupDetails.board.piecePositions)) {
        otherPieces[id] = {
            tiles: userPiece.tiles,
            color: constants.PUBLIC_COLORS[userPiece.symbol] 
        }
    }

    // set username box
    if (userBox != null) {
        userBox.innerHTML = `<div>${user.name} (You)</div><div>0</div>`;
        userBox.style.backgroundColor = constants.COLORS[user.symbol]
    }

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

    display = new Display(document);

    let pieces = [
        ...Object.values(otherPieces),
        ...game.getPieceDetails(user.symbol)
    ];

    display.updateBoard(game, pieces);
    display.updatePreview(game);

    playerControl = new PlayerControl(document, game, display, socket, otherPieces, user);

    if (game.gameOver) {
        document.getElementById('boardOverlay').innerHTML = `${setupDetails.board.latestLoser} lost the game :C`
        loading.style.visibility = 'visible';
    } else {
        // emit your position
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

    if (game.checkPieceMoved(initialPosition)) {
        socket.emit('movePiece', {
            id: user.id,
            tiles: game.getCurrentPiece().getTiles(),
            symbol: user.symbol
        });
    }
    
    // check if game over
    if (game.gameOver) {
        document.getElementById('boardOverlay').innerHTML = `${user.name} lost the game :C`

        loading.style.visibility = 'visible';

        display.dimBoard();
        socket.emit('playerLost', user.name);
    }

    let pieces = [
        ...Object.values(otherPieces),
        ...game.getPieceDetails(user.symbol)
    ];

    display.updateBoard(game, pieces);

});

socket.on('pieceUpdate', userPiece => {
    otherPieces[userPiece.id] = {
        tiles: userPiece.tiles,
        color: constants.PUBLIC_COLORS[userPiece.symbol] 
    }

    
    let pieces = [
        ...Object.values(otherPieces),
        ...game.getPieceDetails(user.symbol)
    ];

    display.updateBoard(game, pieces);
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

    let pieces = [
        ...Object.values(otherPieces),

        ...game.getPieceDetails(user.symbol)
    ];

    display.updateBoard(game, pieces);
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


    let pieces = [
        ...game.getPieceDetails(user.symbol)
    ];

    display.updateBoard(game, pieces);
    display.updatePreview(game);

    playerControl.restartGameTimers();

    // emit your position
    socket.emit('movePiece', {
        id: user.id,
        tiles: game.getCurrentPiece().getTiles(),
        symbol: user.symbol
    });
})