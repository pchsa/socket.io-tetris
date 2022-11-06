import { PIECES } from './constants.js'

/**
 * Generates next pieces based on 7 bag system
 */
export class ShapeGenerator{
    constructor() {
        this.upcomingPieces = [...this.generateBag(), ...this.generateBag()];
    }

    /**
     * shuffles order of input array
     * @param {*} array 
     * @returns shuffled array
     */
    shuffle(array) {
        let currentIndex = array.length,  randomIndex;
        
        // While there remain elements to shuffle.
        while (currentIndex != 0) {
        
            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
        
            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }
        
        return array;
    }
    
    /**
     * 
     * @returns randomised bag of tetris pieces
     */
    generateBag() {
        return this.shuffle(Object.keys(PIECES));
    }

    /**
     * 
     * @returns next piece from bag
     */
    getNext() {
        if (this.upcomingPieces.length < 7) {
            this.upcomingPieces = [...this.upcomingPieces, ...this.generateBag()];
        }
        return this.upcomingPieces.shift();
    }

    /**
     * 
     * @returns next 5 pieces
     */
    getUpcomingDisplayPieces() {
        return this.upcomingPieces.slice(0, 5);
    }
}


