let socket = new WebSocket("ws://mel.ws2019.dev.sesc-nsu.ru:8080/ws");
window.socket = socket;
window.uuid = Math.round(Math.random()*8999999999)+1000000000;
console.log("Attempting Connection...");

socket.onopen = () => {
    console.log("Successfully Connected");
    /*let data = {
        uuid: window.uuid,
        line: arr
    }
    socket.send(JSON.stringify(data))*/
};

socket.onmessage = function(event) {
    console.log("Получены данные " + event.data);
    let data = JSON.parse(event.data);
    console.log(data);
    if (data.uuid == window.uuid) return;
    let krivaya = svgPolylines2(data.line, data.color);
    document.getElementById("SvgjsSvg1001").appendChild(krivaya);
};

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!")
};

socket.onerror = error => {
    console.log("Socket Error: ", error);
};