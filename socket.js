let socket = new WebSocket("ws://mel.ws2019.dev.sesc-nsu.ru:8081/ws");
window.socket = socket;
window.uuid = Math.round(Math.random()*8999999999)+1000000000;
console.log("Attempting Connection...");

socket.onopen = () => {
    console.log("Successfully Connected");
};

socket.onmessage = function(event) {
    console.log("Получены данные " + event.data);
    let data = JSON.parse(event.data);

    if (data.type === 'number'){
        document.getElementById("number").innerHTML = data.number;
    }
    else if (data.uuid == window.uuid) return;

    if (data.type === 'polyline') {
        let krivaya = svgPolylines2(data.points, data.color);
        document.getElementById("SvgjsSvg1001").appendChild(krivaya);
    }
    else if (data.type === 'rect'){
        draw.rect().attr(data.atr);
    }
    else if (data.type === 'ellipse'){
        draw.ellipse().attr(data.atr);
    }
    else if (data.type === 'text'){
        draw.text(data.text).attr(data.atr);
    }
};

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!")
};

socket.onerror = error => {
    console.log("Socket Error: ", error);
};