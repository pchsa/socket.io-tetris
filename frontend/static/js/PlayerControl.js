import { Display } from './display.js';
import { Game } from './game.js'

import { settings } from './settings.js'

let loading = document.getElementById('loader');


export class PlayerControl {

    /**
     * 
     * @param {Document} document 
     * @param {Game} game 
     * @param {Display} display 
     * @param {*} socket 
     * @param {*} otherPieces 
     * @param {*} user 
     */
    constructor(
        document,
        game,
        display,
        socket,
        otherPieces,
        user
    ) { 
        this.game = game;
        this.display = display;
        this.user = user;
        this.socket = socket;
        this.otherPieces = otherPieces;

        this.maxPieceTimer = null;
        this.setMaxPieceTimer();



        this.stillPieceTimer = null;


        this.pieceFallLoop = null;
        this.setPieceFallLoop();

        this.keysHeld = new Set();

        this.horizontalShiftDelay = null;
        this.horizontalShiftLoop = null;


        document.addEventListener('keydown', (event) => {
            if (document.activeElement != null && document.activeElement.tagName == "INPUT") {
                this.handleSettingsInput(event);
                return;
            }

            if (this.keysHeld.has(event.code)) {   
                // ignore key if already pressing
                return;
            }

            if (this.game.gameOver) {
                this.keysHeld = new Set();
                return;
            }

            this.keysHeld.add(event.code);
        
            let initialPosition = this.game.getCurrentPosition();
            
            switch (event.code) {
                case settings.MOVE_LEFT:
                    this.game.getCurrentPiece().translate('LEFT');
                    if (this.keysHeld.has(settings.SOFT_DROP)) {
                        this.game.getCurrentPiece().dropPiece();
                    }
                    this.setHorizontalShiftDelay('LEFT');
                    this.setStillPieceTimer();

                    break;
                case settings.MOVE_RIGHT:
                    this.game.getCurrentPiece().translate('RIGHT');
                    if (this.keysHeld.has(settings.SOFT_DROP)) {
                        this.game.getCurrentPiece().dropPiece();
                    }
                    this.setHorizontalShiftDelay('RIGHT');
                    this.setStillPieceTimer();

                    
                    break;
                case settings.SOFT_DROP:
                    this.game.getCurrentPiece().dropPiece();
                    this.setStillPieceTimer();

                    break;
                case settings.HARD_DROP:
                    this.setMaxPieceTimer();
                    this.setStillPieceTimer();
                    let pieceInformation = this.game.placePiece(this.user.symbol);


                    if (pieceInformation.linesCleared) {
                        this.setPieceFallLoop();
                        document.getElementById('user').innerHTML = `
                            <div>${this.user.name} (You)</div><div>${this.game.linesCleared}</div>`
                        ;
                        this.socket.emit('clearedLines', {
                            id:this.user.id,
                            totalLines:this.game.linesCleared
                        })
                    }
                    this.socket.emit('placePiece', {
                        boardArray:this.game.boardArray,
                        tiles:pieceInformation.tiles,
                    });
                    this.display.updatePreview(this.game);
                    break   
                case settings.ROTATE_LEFT:
                    this.game.getCurrentPiece().rotate(false);
                    this.setStillPieceTimer();

                    break;
                case settings.ROTATE_RIGHT:
                    this.game.getCurrentPiece().rotate(true);
                    this.setStillPieceTimer();

                    break;
                case settings.ROTATE_180:
                    this.game.getCurrentPiece().rotate180();
                    this.setStillPieceTimer();

                    break;
                case settings.HOLD:
                    this.game.holdPiece();
                    this.display.updateHold(this.game);
                    this.setMaxPieceTimer();
                    this.setPieceFallLoop();

                    break;
            }
        
            if (this.game.checkPieceMoved(initialPosition)) {
                this.socket.emit('movePiece', {
                    id: this.user.id,
                    tiles: this.game.getCurrentPiece().getTiles(),
                    symbol: this.user.symbol
                });

                this.updateDisplayBoard();

            }

            if (this.game.gameOver) {
                document.getElementById('boardOverlay').innerHTML = `${this.user.name} lost the game :C`
                loading.style.visibility = 'visible';
                
                this.display.dimBoard();
                this.socket.emit('playerLost', this.user.name);
            }
        })

        document.addEventListener('keyup', (event) => {
            this.keysHeld.delete(event.code);
            if (game.gameOver) {
                return;
            }
            switch (event.code) {
                case settings.MOVE_LEFT:
                    this.clearHorizontalShiftTimers();
                    if (this.keysHeld.has(settings.MOVE_RIGHT)) {
                        this.setHorizontalShiftDelay('RIGHT');
                    }
                    break;
                case settings.MOVE_RIGHT:
                    this.clearHorizontalShiftTimers();
                    if (this.keysHeld.has(settings.MOVE_LEFT)) {
                        this.setHorizontalShiftDelay('LEFT')
                    }
                    break;
            }
        })
    }

    setMaxPieceTimer() {
        clearInterval(this.maxPieceTimer);

        this.maxPieceTimer = setTimeout(() => {
            if (this.game.gameOver) {
                return;
            }

            this.setStillPieceTimer();
            let pieceInformation = this.game.placePiece(this.user.symbol);

            if (pieceInformation.linesCleared) {
                document.getElementById('user').innerHTML = `
                    <div>${this.user.name} (You)</div><div>${this.game.linesCleared}</div>`
                ;
                this.socket.emit('clearedLines', {
                    id:this.user.id,
                    totalLines:this.game.linesCleared
                })
            }

            this.setPieceFallLoop();

            this.socket.emit('placePiece', {
                boardArray:this.game.boardArray,
                tiles:pieceInformation.tiles
            });


            this.socket.emit('movePiece', {
                id: this.user.id,
                tiles: this.game.getCurrentPiece().getTiles(),
                symbol: this.user.symbol
            });

            this.display.updatePreview(this.game);

            this.updateDisplayBoard();

            if (this.game.gameOver) {
                
                document.getElementById('boardOverlay').innerHTML = `${this.user.name} lost the game :C`
                loading.style.visibility = 'visible';
                
                this.socket.emit('playerLost', this.user.name);
            }

            this.setMaxPieceTimer();
        }, 10000)
    }

    setStillPieceTimer() {
        clearTimeout(this.stillPieceTimer);

        this.stillPieceTimer = setTimeout(() => {
            if (this.game.gameOver) {
                return;
            }

            // if no longer at final position just quit
            if (!this.game.atFinalPosition()) {
                return;
            }
            let pieceInformation = this.game.placePiece(this.user.symbol);

            if (pieceInformation.linesCleared) {
                document.getElementById('user').innerHTML = `
                    <div>${this.user.name} (You)</div><div>${this.game.linesCleared}</div>`
                ;
                this.socket.emit('clearedLines', {
                    id:this.user.id,
                    totalLines:this.game.linesCleared
                })
            }
            this.setStillPieceTimer();


            this.setPieceFallLoop();

            this.socket.emit('placePiece', {
                boardArray:this.game.boardArray,
                tiles:pieceInformation.tiles
            });

            this.socket.emit('movePiece', {
                id: this.user.id,
                tiles: this.game.getCurrentPiece().getTiles(),
                symbol: this.user.symbol
            });
            this.display.updatePreview(this.game);

            this.updateDisplayBoard();

            if (this.game.gameOver) {
                
                document.getElementById('boardOverlay').innerHTML = `${this.user.name} lost the game :C`
                loading.style.visibility = 'visible';
                
                this.socket.emit('playerLost', this.user.name);
            }

            this.setMaxPieceTimer();
        }, 500);
    }

    setMovingPieceTimer() {

    }


    /**
     * This is a horribly coded function :C
     * @param {KeyboardEvent} event 
     */
    handleSettingsInput(event) {
        let inputField = null;
        if (document.activeElement === (inputField = document.getElementById('moveLeft'))) {
            inputField.value = event.code;
            settings.MOVE_LEFT = inputField.value;
        } else if (document.activeElement === (inputField = document.getElementById('moveRight'))) {
            inputField.value = event.code;
            settings.MOVE_RIGHT = inputField.value
        } else if (document.activeElement === (inputField = document.getElementById('softDrop'))) {
            inputField.value = event.code;
            settings.SOFT_DROP = inputField.value
        } else if (document.activeElement === (inputField = document.getElementById('hardDrop'))) {
            inputField.value = event.code;
            settings.HARD_DROP = inputField.value;
        } else if (document.activeElement === (inputField = document.getElementById('rotateLeft'))) {
            inputField.value = event.code;
            settings.ROTATE_LEFT = inputField.value;
        } else if (document.activeElement === (inputField = document.getElementById('rotateRight'))) {
            inputField.value = event.code;
            settings.ROTATE_RIGHT = inputField.value;
        } else if (document.activeElement === (inputField = document.getElementById('rotate180'))) {
            inputField.value = event.code;
            settings.ROTATE_180 = inputField.value;
        } else if (document.activeElement === (inputField = document.getElementById('hold'))) {
            inputField.value = event.code;
            settings.HOLD = inputField.value;
        } else if (document.activeElement === (inputField = document.getElementById('das'))) {
            settings.DAS = parseInt(inputField.value);
        } else if (document.activeElement === (inputField = document.getElementById('arr'))) {
            settings.ARR = parseInt(inputField.value);
        }
    }

    setPieceFallLoop() {
        clearInterval(this.pieceFallLoop);

        if (this.game.gameOver) {
            return;
        }

        this.pieceFallLoop = setInterval(() => {
            if (this.game.gameOver) {
                clearInterval(this.pieceFallLoop);
                return;
            }

            let initialPosition = this.game.getCurrentPosition();

            this.game.getCurrentPiece().translate('DOWN');

            if (this.game.atFinalPosition()) {
                this.setStillPieceTimer();
            }
    
            if (this.game.checkPieceMoved(initialPosition)) {
                this.socket.emit('movePiece', {
                    id: this.user.id,
                    tiles: this.game.getCurrentPiece().getTiles(),
                    symbol: this.user.symbol
                });
    
                this.updateDisplayBoard();
            }

        }, 1000)
    }

    setHorizontalShiftDelay(direction) {
        this.clearHorizontalShiftTimers();

        this.horizontalShiftDelay = setTimeout(() => {
            if (this.game.gameOver) {
                this.clearHorizontalShiftTimers();
                return;
            }

            this.setHorizontalShiftLoop(direction);
        }, settings.DAS);
    }

    setHorizontalShiftLoop(direction) {
        this.horizontalShiftLoop = setInterval(() => {
            if (this.game.gameOver) {
                this.clearHorizontalShiftTimers();
                return;
            }

            let initialPosition = this.game.getCurrentPosition();

            this.game.getCurrentPiece().translate(direction);

            if (this.keysHeld.has(settings.SOFT_DROP)) {
                this.game.getCurrentPiece().dropPiece();
                // CHECK LOCK DELAY HERE DO NOT FORGET BRO.
            }

            if (this.game.checkPieceMoved(initialPosition)) {
                this.socket.emit('movePiece', {
                    id: this.user.id,
                    tiles: this.game.getCurrentPiece().getTiles(),
                    symbol: this.user.symbol
                });

                this.updateDisplayBoard();
            }
        }, settings.ARR);
    }

    restartGameTimers() {
        // restart loops and what not;
        this.setPieceFallLoop();
        this.setMaxPieceTimer();
    }

    clearHorizontalShiftTimers() {
        clearTimeout(this.horizontalShiftDelay);
        clearTimeout(this.horizontalShiftLoop);
    }

    

    updateDisplayBoard() {
        let pieces = [
            ...Object.values(this.otherPieces),
            ...this.game.getPieceDetails(this.user.symbol)
        ];
    
        this.display.updateBoard(this.game, pieces);
    }
}