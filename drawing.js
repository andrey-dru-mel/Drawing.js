const draw = SVG('drawing');
let index = 0;
let shape;
let shapes = [];
let timer;
let option = [];
let point = {x:0};
let krivaya;
let text;
let color;
const tmpPolylineId = window.uuid + "tmpline";

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
  option = {
    stroke: color,
    'stroke-width': 1,
    'fill-opacity': 0,
  };

  if (shape === 'text')
    text = prompt("Введите текст:", "Текст");

  switch (shape) {
    case 'polyline':
      return [];
    case 'mouse paint':
      return draw.polyline().attr(option);
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

  if (shape ==='rect'){
    point = {
      x: event.offsetX,
      y: event.offsetY,
    }
  }
  if (shape === 'text'){
    option = {
      x: event.offsetX,
      y: event.offsetY,
      'font-size':100,
    }
    shapes[index].attr(option);
  }

  if (shape === 'polyline') {
    let date = new Date();
    timer = date.getTime();
    mousedown = true;
    shapes[index] = [];
    shapes[index].push([event.offsetX, event.offsetY]);
  }
  else{
    shapes[index].draw(event);
  }
});
draw.on('mousemove', event => {
  if (shape === 'polyline' && mousedown && shapes[index]) {
    let date = new Date();
    let ms = date.getTime();

    shapes[index].push([event.offsetX, event.offsetY]);
    krivaya = svgPolylines2(shapes[index], color);
    krivaya.setAttribute("id", tmpPolylineId);
    if (document.getElementById(tmpPolylineId)){document.getElementById(tmpPolylineId).remove();}
    document.getElementById("SvgjsSvg1001").appendChild(krivaya);
    shapes[index].splice(shapes[index].length - 1, 1);

    if ((ms-timer)*Math.sqrt((Math.pow((event.offsetX-shapes[index][shapes[index].length-1][0]), 2) +
        Math.pow((event.offsetY-shapes[index][shapes[index].length-1][1]), 2))) <1000) return;
    else timer = ms;
    shapes[index].push([event.offsetX, event.offsetY]);
  }
  if (shape === 'mouse paint' && shapes[index]){
    shapes[index].draw('point', event);
  }
})
draw.on('mouseup', event => {
  if (shape ==='polyline') {
    shapes[index].push([event.offsetX, event.offsetY]);
    krivaya = svgPolylines2(shapes[index], color);
    krivaya.setAttribute("id", tmpPolylineId);
    if (document.getElementById(tmpPolylineId)) {
      document.getElementById(tmpPolylineId).remove();
    }
    document.getElementById("SvgjsSvg1001").appendChild(krivaya);
    if (document.getElementById(tmpPolylineId)) document.getElementById(tmpPolylineId).removeAttribute("id");
  }
  else if (shape === 'mouse paint'){
    shapes[index].draw('stop', event);
  }
  else if (shape === 'rect'){
    point.width = event.offsetX - point.x;
    point.height = event.offsetY - point.y;
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