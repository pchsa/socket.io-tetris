export class Board {
    constructor() {
        this.boardArray = this.generateEmptyBoard();
        this.piecePositions = {};
        this.gameOver = false;
        this.latestLoser = null;
        this.linesCleared = 0;
    }

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

    checkTilesOccupied(tiles) {
        return tiles.some(([x, y]) => this.boardArray[y][x] != 'E');
    }

    raiseTiles(tiles) {
        return tiles.map(([x, y]) => [x, y - 1]);
    }

    checkTilesFatal(tiles) {
        return tiles.some(([x, y]) => y <= 1);
    }

    getFreeTiles(tiles) {
        while (this.checkTilesOccupied(tiles) && !this.checkTilesFatal(tiles)) {
            tiles = this.raiseTiles(tiles);
        }

        return tiles;
    }

    setTiles(tiles, symbol) {
        tiles.forEach(([x, y]) => {
            this.boardArray[y][x] = symbol;
        });
    }

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

    getWidth() {
        return this.boardArray[0].length;
    }
}

export function generateEmptyBoard() {
    let array = [];
    for (let j = 0; j < 24; j++) {
        let row = []
        for (let i = 0; i < 15; i++) {
            row.push('E')
        }
        array.push(row);
    }
    return array;   
}