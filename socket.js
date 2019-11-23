let socket = new WebSocket("ws://localhost:8080/ws");
window.socket = socket;
window.uuid = Math.random()*8999999999+1000000000;
console.log("Attempting Connection...");

socket.onopen = () => {
    console.log("Successfully Connected");
    let arr = [1, 2, 3, 4];
    let data = {
        uuid: window.uuid,
        line: arr
    }
    socket.send(JSON.stringify(data))
};

socket.onmessage = function(event) {
    alert("Получены данные " + event.data);
};

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!")
};

socket.onerror = error => {
    console.log("Socket Error: ", error);
};