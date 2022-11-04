const socket = io();

socket.on('message', message => {
    console.log(message);
    console.log("hello");
    console.log("hello")
});