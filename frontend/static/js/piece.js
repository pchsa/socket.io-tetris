import { Game } from './game.js'
import { 
    DIRECTIONS,
    PIECES,
    STANDARD_KICK_TABLE,
    I_KICK_TABLE,
    ROTATE_180_KICK_TABLE,
    HIDDEN_TILE_ROWS
} from './constants.js'

export class Piece {
    /**
     * A Piece with a piece configuration and assigned board.
     * 
     * @param {string} piece
     * @param {Game} game game to be placed on
     */
    constructor(piece, game) {
        this.game = game;
        this.piece = piece;

        this.states = PIECES[piece];
        this.rotationState = 0;
        this.state = this.states[this.rotationState];

        this.xPosition = Math.floor(game.getWidth()/2) - 2;
        this.yPosition = HIDDEN_TILE_ROWS;

        this.liftToValidPosition();



        if (this.checkFatalPosition()) {
            game.gameOver = true;
        }
    }

    /**
     * Check if a given x,y coordinate is in bounds
     * @param {number} x 
     * @param {number} y 
     */
    checkTileInBounds(x, y) {
        return (
            x >= 0 &&
            x < this.game.getWidth() &&
            y >= 0 &&
            y < this.game.getHeight()
        );
    }

    /**
     * Check if a given x,y coordinate is in occupied
     * @param {number} x 
     * @param {number} y 
     */
    checkTileOccupied(x, y) {
        return this.game.boardArray[y][x] != 'E';
    }

    /**
     * Check if a given position is valid
     * @param {number} x 
     * @param {number} y 
     * @param {number[][]} state 
     */
    checkPositionValid(x, y, state) {
        // loop through each row in piece state
        for (let j = 0; j < state.length; j++) {
            let row = state[j];

            // loop through each tile in piece row
            for (let i = 0; i < row.length; i++) {
                let tile = row[i];
                if (tile) {
                    // get tile piece in relation to actual board
                    let checkTileX = x + i;
                    let checkTileY = y + j;
                    
                    // return false if tile is out of bounds
                    if (!this.checkTileInBounds(checkTileX, checkTileY) ||
                        this.checkTileOccupied(checkTileX, checkTileY)) {
                        
                        return false;
                    }
                }
            }
        }

        // reaches here if every tile in position is valid
        return true;
    }

    /**
     * Moves piece to desired coordinate if it is valid position
     * @param {number} x new x position of block
     * @param {number} y new y position of block
     */
    move(x, y) {
        if (this.checkPositionValid(x, y, this.state)) {
            this.xPosition = x;
            this.yPosition = y;
        }
    }

    /**
     * Translate piece towards given direction
     * @param {string} direction 
     */
    translate(direction) {
        let translateX = DIRECTIONS[direction][0];
        let translateY = DIRECTIONS[direction][1];
        this.move(this.xPosition + translateX, this.yPosition + translateY);
    }

    /**
     * Get tile coordinates in relation to the board
     * @returns coordiates of each occupied tile
     */
    getTiles() {
        let tiles = [];
        // loop through all tiles in piece state
        for (let j = 0; j < this.state.length; j++) {
            let row = this.state[j];
            for (let i = 0; i < row.length; i++) {
                let tile = row[i];
                if (tile) {
                    tiles.push([this.xPosition + i, this.yPosition + j])
                }
            }
        }
        return tiles;
    }

    /**
     * Attempt to rotate a piece
     * @param {Boolean} clockwise true if rotating clockwise
     */
    rotate(clockwise) {
        if (this.piece == 'O') {
            return;
        }

        let rotateDirection = clockwise ? 1 : -1;

        let statesLength = Object.keys(this.states).length;

        // state to test, add 4 to ensure state is positive and between 0 to 3
        let rotationTestState = ((this.rotationState + rotateDirection) + statesLength) % statesLength;
        let testState = this.states[rotationTestState];

        let kickTable = this.piece == 'I' ? I_KICK_TABLE : STANDARD_KICK_TABLE;
        let transitionKey = this.rotationState.toString() + rotationTestState.toString();
        // test every kick position to see if rotation is suitable
        for (let [xKick, yKick] of kickTable[transitionKey]) {
            let testPositionX = this.xPosition + xKick;
            let testPositionY = this.yPosition - yKick;

            if (this.checkPositionValid(testPositionX, 
                testPositionY, testState)) {
                this.rotationState = rotationTestState;
                this.state = testState;
                this.move(testPositionX, testPositionY);
                break;
            }
        }
    }

    /**
     * Attempt to rotate a piece 180 degrees.
     */
    rotate180() {
        if (this.piece == 'O') {
            return;
        }

        let statesLength = Object.keys(this.states).length;

        let rotationTestState = (this.rotationState + 2) % statesLength;
        let testState = this.states[rotationTestState];

        let kickTable = ROTATE_180_KICK_TABLE;
        let transitionKey = this.rotationState.toString() + rotationTestState.toString();

        // test every kick position to see if rotation is suitable
        for (let [xKick, yKick] of kickTable[transitionKey]) {
            let testPositionX = this.xPosition + xKick;
            let testPositionY = this.yPosition - yKick;

            if (this.checkPositionValid(testPositionX, 
                testPositionY, testState)) {
                this.rotationState = rotationTestState;
                this.state = testState;
                this.move(testPositionX, testPositionY);
                break;
            }
        }
    }

    /**
     *
     * @returns y position where y cannot be any lower
     */
    getFinalYPosition() {
        let testY = this.yPosition;
        while (this.checkPositionValid(this.xPosition, testY+1, this.state)) {
            testY += 1;
        }
        return testY;
    }

    /**
     * 
     * @returns coordinates of tiles at final position
     */
    getFinalTiles() {
        let finalY = this.getFinalYPosition();
        let tiles = [];

        // loop through all tiles in piece state
        for (let j = 0; j < this.state.length; j++) {
            let row = this.state[j];
            for (let i = 0; i < row.length; i++) {
                let tile = row[i];
                if (tile) {
                    tiles.push([this.xPosition + i, finalY + j]);
                }
            }
        }
        return tiles;
    }

    /**
     * drop piece to final position
     */
    dropPiece() {
        this.yPosition = this.getFinalYPosition();
    }
    
    /**
     * Shift piece upwards until valid position found (or no piece out of bounds)
     */
    liftToValidPosition() {
        while (
            !this.checkPositionValid(this.xPosition, this.yPosition, this.state)
            && !this.checkFatalPosition()) {

            this.yPosition -= 1;
        }

        if (this.checkFatalPosition()) {
            this.game.gameOver = true;
        }
    }

    /**
     * Check if piece out of bounds
     */
    checkFatalPosition() {
        return this.yPosition <= 1;
    }

    /**
     * Reset position of piece to starting position.
     */
    resetPosition() {
        this.xPosition = Math.floor(this.game.getWidth()/2) - 2;
        this.yPosition = HIDDEN_TILE_ROWS;
    }
}