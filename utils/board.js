export class Board {
    constructor() {
        this.boardArray = this.generateEmptyBoard();
        this.piecePositions = {};
        this.gameOver = false;
        this.latestLoser = null;
        this.linesCleared = 0;
    }

    /**
     * 
     * @returns empty board array
     */
    generateEmptyBoard() {
        let array = [];
        for (let j = 0; j < 23; j++) {
            let row = []
            for (let i = 0; i < 14; i++) {
                row.push('E')
            }
            array.push(row);
        }
        return array;     
    }

    /**
     * 
     * @param {number[][]} tiles 
     * @returns true if any tile are already occupied
     */
    checkTilesOccupied(tiles) {
        return tiles.some(([x, y]) => this.boardArray[y][x] != 'E');
    }

    /**
     * 
     * @param {number[][]} tiles 
     * @returns new array of tiles with y position lifted by 1
     */
    raiseTiles(tiles) {
        return tiles.map(([x, y]) => [x, y - 1]);
    }

    /**
     * 
     * @param {number[][]} tiles 
     * @returns true if any tile in is fatal position
     */
    checkTilesFatal(tiles) {
        return tiles.some(([x, y]) => y <= 1);
    }

    /**
     * 
     * @param {number[][]} tiles 
     * @returns tiles lifted to unoccupied position
     */
    getFreeTiles(tiles) {
        while (this.checkTilesOccupied(tiles) && !this.checkTilesFatal(tiles)) {
            tiles = this.raiseTiles(tiles);
        }

        return tiles;
    }

    /**
     * Fill board array with symbol at given tiles' [x, y]
     * @param {number[][]} tiles 
     * @param {string} symbol 
     */
    setTiles(tiles, symbol) {
        tiles.forEach(([x, y]) => {
            this.boardArray[y][x] = symbol;
        });
    }

    /**
     * Clear any full lines.
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
    }
    
    /**
     * 
     * @returns witdth of board array
     */
    getWidth() {
        return this.boardArray[0].length;
    }
}