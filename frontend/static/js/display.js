import {
    SQUARE_SIZE,
    SQUARE_ROUND,
    MARGIN,
    COLORS,
    HIDDEN_TILE_ROWS,
    PIECES
} from './constants.js'

import { Piece } from './piece.js'

import { Game } from './game.js'

// convert number of tiles to a canvas length
function getCanvasSize(size) {
    return (SQUARE_SIZE + MARGIN) * size + MARGIN;
}

/**
 * A display class to display tetris tiles, preview pieces, and hold piece
 */
export class Display {

    /**
     * 
     * @param {Document} document 
     */
    constructor(document) {
        this.tileCanvas = document.getElementById('boardCanvas');
        this.tileCtx = this.tileCanvas.getContext('2d');

        this.previewCanvas = document.getElementById('nextCanvas');
        this.previewCtx = this.previewCanvas.getContext('2d');

        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
    }

    /**
     * Draw all tile colors for a specific board of any size.
     * @param {string[][]} tiles 
     */
    drawBoardTiles(tiles) {
        let width = tiles[0].length;
        let height = tiles.length; 

        this.tileCanvas.width = getCanvasSize(width);
        this.tileCanvas.height = getCanvasSize(height - HIDDEN_TILE_ROWS);
        
        for (let j = 0; j < height; j++) {
            for (let i = 0; i < width; i++) {
                this.drawTile(COLORS[tiles[j][i]], i, j, this.tileCtx);
            }
        }
    }

    /**
     * Draw a tile color at a specifix x, y coordinate
     * @param {string} color 
     * @param {number} x 
     * @param {number} y 
     */
    drawTile(color, x, y, ctx, hidden = true) {
        ctx.beginPath();
        ctx.fillStyle = color;
        if (hidden) {
            y -= HIDDEN_TILE_ROWS
        }
        ctx.roundRect(
            MARGIN + (SQUARE_SIZE + MARGIN) * x,
            MARGIN + (SQUARE_SIZE + MARGIN) * y,
            SQUARE_SIZE,
            SQUARE_SIZE,
            SQUARE_ROUND
        );
        ctx.fill();
    }

    clearBoard() {
        this.tileCtx.clearRect(0, 0, 
            this.tileCanvas.width, 
            this.tileCanvas.height
        );
    }

    dimBoard() {
        this.tileCtx.beginPath();
        this.tileCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.tileCtx.roundRect(0, 0,
            this.tileCanvas.width, 
            this.tileCanvas.height,
            4
        );
        this.tileCtx.fill();
        console.log('hello dimmer')
    }

    drawPiece(pieceTiles, color) {
        pieceTiles.forEach(([x, y]) => {
            this.drawTile(color, x, y, this.tileCtx);
        });
    }

    /**
     * 
     * @param {Game} game 
     * @param {} otherPieces 
     */
    updateBoard(game, pieces = []) {
        this.clearBoard();
        this.drawBoardTiles(game.boardArray);

        pieces.forEach((pieceDetail) => {
            this.drawPiece(
                pieceDetail.tiles,
                pieceDetail.color
            );
        });

        if (game.gameOver) {
            this.dimBoard();
        }
    }


    clearPreview() {
        this.previewCtx.clearRect(0, 0, 
            this.previewCanvas.width, 
            this.previewCanvas.height
        );
    }

    /**
     * 
     * @param {Game} game 
     */
    updatePreview(game) {
        let nextPieces = game.shapeGenerator.getUpcomingDisplayPieces()

        this.clearPreview();

        let currentX = 0;
        let currentY = 0;

        nextPieces.forEach(piece => {
            let pieceState = PIECES[piece][0];

            pieceState.forEach(pieceRow => {
                pieceRow.forEach(pieceTile => {
                    if (pieceTile) {
                        let pieceColor = COLORS[piece];
                        this.drawTile(
                            pieceColor,
                            currentX,
                            currentY,
                            this.previewCtx,
                            false
                        );
                    }
                    currentX++;
                })
                currentY++;
                currentX = 0;
            })
        })
    }

    clearHold() {
        this.holdCtx.clearRect(0, 0, 
            this.holdCanvas.width, 
            this.holdCanvas.height
        );
    }

    /**
     * 
     * @param {Game} game 
     */
    updateHold(game) {
        this.clearHold();

        let holdPiece = game.heldPiece;
        let pieceState = PIECES[holdPiece][0];
        let height = pieceState.length;
        let width = pieceState[0].length;
        
        for (let j = 0; j < height; j++) {
            for (let i = 0; i < width; i++) {
                if (pieceState[j][i]) {
                    this.drawTile(COLORS[holdPiece], i, j, this.holdCtx, false);
                }
            }
        }
    }
}