let draw = SVG('SVGdiv');
let index = 0;
let shape;
let shapes = [];
let timer;
let option = [];
let point = {};
let krivaya;
let text, width, fill;
let color;
const tmpPolylineId = window.uuid + "tmpline";

let buttonClear = document.getElementById("clear");
let buttonSave = document.getElementById("save");

buttonSave.onclick = function downloadSVG() {
    const blob = new Blob(
        [document.getElementById("SVGdiv").innerHTML],
        {
            type: "image/svg+xml"
        }
    );
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "image.svg";
    link.click();
}

buttonClear.onclick = function ok(){
  shapes[index] = [];
  let myNode = document.getElementById("SvgjsSvg1001");
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }
  draw.image(window.URLIMG);
  let data = {
      type: "ClearAll",
      uuid: window.uuid,
      urlid: window.urlid,
  }
  window.socket.send(JSON.stringify(data));
}

let mousedown = false;

function createElementFromHTML(htmlString) {
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
}

const getDrawObject = function() {
  shape = document.getElementById('shape').value;
  color = document.getElementById('color').value;
  width = document.getElementById('width').value;
  fill = document.getElementById('fill').value;
  option = {
    stroke: color,
    'stroke-width': width,
    'fill-opacity': 0,
    'stroke-dasharray': fill,
  };

  if (shape === 'text') {
    option['stroke-width'] = 1;
      option['stroke-dasharray'] = 0;
    text = prompt("Введите текст:", "Текст");
  }

  switch (shape) {
    case 'polyline':
      return [];
    case 'line':
      return draw.line().attr(option);
    case 'ellipse':
      return draw.ellipse().attr(option);
    case 'rect':
      return draw.rect().attr(option);
    case 'text':
      return draw.text(text).attr(option);
  }
  return null;
}

draw.on('mousedown', function(event) {
  shapes[index] = getDrawObject();

  if (shape === 'rect' || shape === 'text') {
      option.x = event.offsetX;
      option.y = event.offsetY;
  }
  else if (shape === 'ellipse'){
      option.cx = event.offsetX;
      option.cy = event.offsetY;
  }
  else if (shape === 'line'){
      option.x1 = event.offsetX;
      option.y1 = event.offsetY;
  }

  if (shape === 'polyline') {
    let date = new Date();
    timer = date.getTime();
    mousedown = true;
    point = [];
    point.push([event.offsetX, event.offsetY]);
  }
  else if (shape === 'text') {
      size = document.getElementById('size').value;
      option['font-size'] = size;
      option['fill-opacity'] = 1;
      let data = {
        type: shape,
        points: point,
        atr: option,
        uuid: window.uuid,
        urlid: window.urlid,
        color: color,
        text: text,
      };
      shapes[index].attr(option);window.socket.send(JSON.stringify(data));
      index++;
  }
  else{
    shapes[index].draw(event);
  }
});
draw.on('mousemove', event => {
  if (shape === 'polyline' && mousedown && point) {
    let date = new Date();
    let ms = date.getTime();

    point.push([event.offsetX, event.offsetY]);
    krivaya = svgPolylines2(point, color, width, fill);
    krivaya.setAttribute("id", tmpPolylineId);
    if (document.getElementById(tmpPolylineId)){document.getElementById(tmpPolylineId).remove();}
    document.getElementById("SvgjsSvg1001").appendChild(krivaya);
    point.splice(point.length - 1, 1);

    if ((ms-timer)*Math.sqrt((Math.pow((event.offsetX-point[point.length-1][0]), 2) +
        Math.pow((event.offsetY-point[point.length-1][1]), 2))) < 500) return;
    else timer = ms;
    point.push([event.offsetX, event.offsetY]);
  }
})
draw.on('mouseup', event => {
  if (shape ==='polyline') {
    point.push([event.offsetX, event.offsetY]);
    krivaya = svgPolylines2(point, color, width, fill);
    krivaya.setAttribute("id", tmpPolylineId);
    if (document.getElementById(tmpPolylineId)) {
      document.getElementById(tmpPolylineId).remove();
    }
    document.getElementById("SvgjsSvg1001").appendChild(krivaya);
    if (document.getElementById(tmpPolylineId)) document.getElementById(tmpPolylineId).removeAttribute("id");
    mousedown = false;
  }
  else if (shape === 'rect'){
    option.width = event.offsetX - option.x;
    if (option.width<0){
      option.x += option.width;
      option.width *= -1;
    }
    option.height = event.offsetY - option.y;
    if (option.height<0){
      option.y += option.height;
      option.height *= -1;
    }
    shapes[index].draw(event);
  }
  else if (shape === 'ellipse'){
    option.rx = event.offsetX - option.cx;
    if (option.rx<0){
      option.rx *= -1;
    }
    option.ry = event.offsetY - option.cy;
    if (option.ry<0){
      option.ry *= -1;
    }
    shapes[index].draw(event);
  }
  else if (shape === 'line'){
      option.x2 = event.offsetX;
      option.y2 = event.offsetY;
      shapes[index].draw(event);
  }
  else{
    shapes[index].draw(event);
  }
  let data = {
    type: shape,
    points: point,
    atr: option,
    uuid: window.uuid,
    urlid: window.urlid,
    color: color,
    text: text,
  };
  window.socket.send(JSON.stringify(data));
  index++;
});

// This is custom extension of line, polyline, polygon which doesn't draw the circle on the line. 
SVG.Element.prototype.draw.extend('line polyline polygon', {

  init:function(e){
    // When we draw a polygon, we immediately need 2 points.
    // One start-point and one point at the mouse-position

    this.set = new SVG.Set();

    var p = this.startPoint,
        arr = [
          [p.x, p.y],
          [p.x, p.y]
        ];

    this.el.plot(arr);
  },

  // The calc-function sets the position of the last point to the mouse-position (with offset ofc)
  calc:function (e) {
    var arr = this.el.array().valueOf();
    arr.pop();

    if (e) {
      var p = this.transformPoint(e.clientX, e.clientY);
      arr.push(this.snapToGrid([p.x, p.y]));
    }

    this.el.plot(arr);

  },

  point:function(e){

    if (this.el.type.indexOf('poly') > -1) {
      // Add the new Point to the point-array
      var p = this.transformPoint(e.clientX, e.clientY),
          arr = this.el.array().valueOf();

      arr.push(this.snapToGrid([p.x, p.y]));

      this.el.plot(arr);

      // Fire the `drawpoint`-event, which holds the coords of the new Point
      this.el.fire('drawpoint', {event:e, p:{x:p.x, y:p.y}, m:this.m});

      return;
    }

    // We are done, if the element is no polyline or polygon
    this.stop(e);

  },

  clean:function(){

    // Remove all circles
    this.set.each(function () {
      this.remove();
    });

    this.set.clear();

    delete this.set;

  },
});