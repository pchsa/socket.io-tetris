import { ShapeGenerator } from "./shapeGenerator.js"
import { Piece } from "./piece.js"
import { COLORS } from "./constants.js";


/**
 * 
 * @returns empty board
 */
function generateEmptyBoard() {
    let array = [];
    for (let j = 0; j < 24; j++) {
        let row = []
        for (let i = 0; i < 10; i++) {
            row.push('E');
        }
        array.push(row);
    }
    return array;
}

export class Game {
    /**
     * 
     * @param {string[][]} boardArray board array of game
     */
    constructor(boardArray) {
        this.boardArray = boardArray || generateEmptyBoard();
        this.shapeGenerator = new ShapeGenerator();

        this.heldPiece = null;
        this.canHold = true;

        this.gameOver = false;
        this.linesCleared = 0;
        
        this.piecesPlaced = 0;
        this.currentPiece = new Piece(this.shapeGenerator.getNext(), this);
    }

    /**
     * Set the board array of the game
     * @param {string[][]} boardArray 
     */
    setBoard(boardArray) {
        this.boardArray = boardArray;
    }

    /**
     * 
     * @returns width of board array
     */
    getWidth() {
        return this.boardArray[0].length;
    }

    /**
     * 
     * @returns height of board array
     */
    getHeight() {
        return this.boardArray.length;
    }

    /**
     * Sets current piece
     * @param {Piece} piece 
     */
    setCurrentPiece(piece) {
        this.currentPiece = piece;
    }

    /**
     * 
     * @returns current piece
     */
    getCurrentPiece() {
        return this.currentPiece;
    }

    /**
     * Drop and lock the current game piece, clear full lines and update 
     * number of lines cleared. Enable player to hold piece again.
     * @param {string} symbol 
     */
    placePiece(symbol) {
        this.currentPiece.dropPiece();
        let tiles = this.currentPiece.getTiles();

        for (let [x, y] of tiles) {
            this.boardArray[y][x] = symbol;
        }

        let linesCleared = this.clearLines();

        // later on, check if dead
        this.setCurrentPiece(new Piece(this.shapeGenerator.getNext(), this));

        this.canHold = true;
        this.piecesPlaced += 1;
        return {
            tiles,
            linesCleared,
        }
    }

    /**
     * Clear full lines.
     * @returns number of lines cleared
     */
    clearLines() {
        let linesCleared = 0;

        let clearedBoard = this.boardArray.filter(line => {
            if (line.every(tile => tile != 'E')) {
                linesCleared++;
                return false;
            }
            return true;
        })

        this.boardArray = clearedBoard;

        for (let i = 0; i < linesCleared; i++) {
            this.boardArray.unshift(new Array(this.getWidth()).fill('E'));
        }

        this.linesCleared += linesCleared;
        return linesCleared;
    }

    /**
     * Hold a piece if the player has not held a peice this turn
     */
    holdPiece() {
        if (!this.canHold) {
            return;
        }

        let pieceToHold = this.getCurrentPiece().piece;
        if (!this.heldPiece) {
            this.heldPiece = pieceToHold;
            this.setCurrentPiece(new Piece(this.shapeGenerator.getNext(), this));
        } else {
            this.setCurrentPiece(new Piece(this.heldPiece, this));
            this.heldPiece = pieceToHold;
        }    
        this.canHold = false;
    }

    /**
     * Check if piece moved from initial position
     * @param {*} initialPosition 
     * @returns true if piece moved
     */
    checkPieceMoved(initialPosition) {
        return (
            initialPosition.x != this.getCurrentPiece().xPosition ||
            initialPosition.y != this.getCurrentPiece().yPosition ||
            initialPosition.rotation != this.getCurrentPiece().rotationState ||
            initialPosition.piece != this.getCurrentPiece().piece
        );
    }

    /**
     * Get the piece tiles, color of actual piece and ghost piece as a list
     * @param {string} userSymbol 
     * @returns {{tiles, color}[]} list of {tiles, color} of actual piece and ghost piece
     */
    getPieceDetails(userSymbol) {
        if (!userSymbol) {
            userSymbol = this.getCurrentPiece().piece;
        }

        return [
            {tiles:this.getCurrentPiece().getFinalTiles(), color:COLORS.G},
            {tiles:this.getCurrentPiece().getTiles(), color:COLORS[userSymbol]},

        ]
    }

    /**
     * Returns the x, y, rotation, and piece (symbol) of current piece
     * @returns {x, y, rotation, piece}
     */
    getCurrentPosition() {
        return {
            x:this.getCurrentPiece().xPosition,
            y:this.getCurrentPiece().yPosition,
            rotation:this.getCurrentPiece().rotationState,
            piece:this.getCurrentPiece().piece
        }
    }

    /**
     * Check if piece is at final position (can no longer move down)
     * @returns true if current piece at final position
     */
    atFinalPosition() {
        return this.getCurrentPiece().getFinalYPosition() == this.getCurrentPiece().yPosition;
    }
}