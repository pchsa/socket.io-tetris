import { generateSlug } from "random-word-slugs";


let symbols = ['Z','J','O','S','L','T','I'];

export class Users {
    constructor() {
        this.users = [];

        this.symbolCounter = 0;
    }

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


    isEmpty() {
        return this.users.length == 0;
    }

    getValidSlug() {
        let wordSlug = generateSlug(2, { format:"lower" })
        while (wordSlug.length > 15) {
            wordSlug = generateSlug(2, { format:"lower" });
        }

        return wordSlug;
    }

    getUser(id) {
        return this.users.find(user => user.id == id);
    }

    removeUser(id) {
        this.users = this.users.filter(user => user.id != id);
    }

    sortUsers() {
        this.users.sort((a,b) => b.score - a.score);
    }
}