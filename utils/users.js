import { generateSlug } from "random-word-slugs";


let symbols = ['Z','J','O','S','L','T','I'];

export class Users {
    constructor() {
        this.users = [];

        this.symbolCounter = 0;
    }

    /**
     * Add user, with random name and symbol
     * @param {*} id 
     * @returns newly added user
     */
    addUser(id) { 
        let user = { 
            id, 
            name: this.getValidSlug(),
            symbol:symbols[this.symbolCounter],
            score:0
        };
        this.symbolCounter = (this.symbolCounter + 1) % 7;
        this.users.push(user);
        
        return user;
    }

    /**
     * Check if no users
     */
    isEmpty() {
        return this.users.length == 0;
    }

    /**
     * 
     * @returns random name where length is not greater than 15
     */
    getValidSlug() {
        let wordSlug = generateSlug(2, { format:"lower" })
        while (wordSlug.length > 15) {
            wordSlug = generateSlug(2, { format:"lower" });
        }

        return wordSlug;
    }

    /**
     * 
     * @param {*} id 
     * @returns user with given id
     */
    getUser(id) {
        return this.users.find(user => user.id == id);
    }

    /**
     * Remove user with given id
     * @param {*} id 
     */
    removeUser(id) {
        this.users = this.users.filter(user => user.id != id);
    }

    /**
     * Sort users by number of lines descending
     */
    sortUsers() {
        this.users.sort((a,b) => b.score - a.score);
    }
}