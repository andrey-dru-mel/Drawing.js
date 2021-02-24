let socket = new WebSocket("ws://mel.ws2019.dev.sesc-nsu.ru:8080/ws");
window.socket = socket;
window.uuid = Math.round(Math.random()*8999999999)+1000000000;
window.urlid = document.location.search;
firstopen = 0;
wasdrawed = 0;
window.URLIMG = '';
console.log("Attempting Connection...");

socket.onopen = () => {
    console.log("Successfully Connected");
};

socket.onmessage = function(event) {
    let data = JSON.parse(event.data);

    if (data.type === 'number'){
        document.getElementById("number").innerHTML = data.number;
        if (data.number === 1 && firstopen === 0){
            firstopen = 1;
            window.URLIMG = prompt("Введите URL картинки:", "https://easy-physic.ru/wp-content/uploads/2017/05/%D0%98%D0%BD%D0%BD%D0%B8%D0%BD%D0%B0_%D1%81%D1%82%D0%B5%D1%80%D0%B5%D0%BE%D0%BC1.png")
        }
        if (window.URLIMG != '') {
            let itog = {
                type: 'UrlImg',
                urlimg: window.URLIMG,
            };
            window.socket.send(JSON.stringify(itog));
        }
    }
    else if (data.type === 'UrlImg'){
        if (data.urlimg != '')
            window.URLIMG = data.urlimg;
        if (wasdrawed === 0 && data.urlimg != '') {
            draw.image(data.urlimg)
            wasdrawed++;
        }
    }
    else if (data.uuid == window.uuid || data.urlid!=window.urlid) return;

    if (data.type === 'ClearAll'){
        let myNode = document.getElementById("SvgjsSvg1001");
        while (myNode.firstChild) {
            myNode.removeChild(myNode.firstChild);
        }
        draw.image(window.URLIMG)
    }
    else if (data.type === 'polyline') {
        let krivaya = svgPolylines2(data.points, data.color, data.atr['stroke-width'], data.atr['stroke-dasharray']);
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
    else if (data.type === 'line'){
        draw.line().attr(data.atr);
    }
};

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!")
};

socket.onerror = error => {
    console.log("Socket Error: ", error);
};