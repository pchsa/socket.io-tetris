export class Board {
    constructor() {
        this.boardArray = this.generateEmptyBoard();
        this.piecePositions = {};
        this.gameOver = false;
        this.latestLoser = null;
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