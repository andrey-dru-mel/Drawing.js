const draw = SVG('drawing');
let index = 0;
let shape;
let shapes;
let polyline = [];
let polytime = [];
const tmpLineId = window.uuid + "tmpline";
const tmpPolylineId = window.uuid + "tmpline";

let mousedown=false;

function createElementFromHTML(htmlString) {
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
}

const getDrawObject = function() {
  shape = document.getElementById('shape').value;
  color = document.getElementById('color').value;
  const option = {
    stroke: color,
    'stroke-width': 2,
    'fill-opacity': 0,
  };
  switch (shape) {
    case 'line':
    return draw.line().attr(option);
    case 'ellipse':
      return draw.ellipse().attr(option);
    case 'rect':
      return draw.rect().attr(option);
  }
  return null;
}

draw.on('mousedown', function(event) {
  mousedown=true;

  shapes = getDrawObject();
  shapes.draw(event);

  if (shape === 'polyline') {
    polyline[index] = [];
    polyline[index].push([event.offsetX, event.offsetY]);
    let date = new Date();
    polytime[index] = date.getTime();
  }
});
draw.on('mousemove', event => {
  if (shape === 'polyline' && mousedown && polyline[index]) {
    let date = new Date();
    let ms = date.getTime();

    polyline[index].push([event.offsetX, event.offsetY]);
    krivaya = svgPolylines2(polyline[index], color);
    krivaya.setAttribute("id", tmpPolylineId);
    if (document.getElementById(tmpPolylineId)){document.getElementById(tmpPolylineId).remove();}
    document.getElementById("SvgjsSvg1001").appendChild(krivaya);
    polyline[index].splice(polyline[index].length - 1, 1);

    if ((ms-polytime[index])*Math.sqrt((Math.pow((event.offsetX-polyline[index][polyline[index].length-1][0]), 2) +
        Math.pow((event.offsetY-polyline[index][polyline[index].length-1][1]), 2))) <1000) return;
    else polytime[index]= ms;
    polyline[index].push([event.offsetX, event.offsetY]);

    krivaya = svgPolylines2(polyline[index], color);
    krivaya.setAttribute("id", tmpPolylineId);
    if (document.getElementById(tmpPolylineId)){document.getElementById(tmpPolylineId).remove();}
    document.getElementById("SvgjsSvg1001").appendChild(krivaya);
  }
  /*else if (shape === 'line' && mousedown && polyline[index]) {
    polyline[index][1] = [event.offsetX, event.offsetY];
    if (document.getElementById(tmpLineId)){document.getElementById(tmpLineId).remove();}
    krivaya = svgPolylines2(polyline[index], color);
    krivaya.setAttribute("id", tmpLineId);
    document.getElementById("SvgjsSvg1001").appendChild(krivaya);
  }*/
})
draw.on('mouseup', event => {
  if (shape ==='polyline' /*|| shape === 'line'*/) {
    if (shape === 'polyline') polyline[index].push([event.offsetX, event.offsetY]);
    else if (shape === 'line') polyline[index][1] = [event.offsetX, event.offsetY];
    krivaya = svgPolylines2(polyline[index], color);
    krivaya.setAttribute("id", tmpPolylineId);
    if (document.getElementById(tmpPolylineId)) {
      document.getElementById(tmpPolylineId).remove();
    }
    document.getElementById("SvgjsSvg1001").appendChild(krivaya);

    if (document.getElementById(tmpLineId)) document.getElementById(tmpLineId).removeAttribute("id");
    if (document.getElementById(tmpPolylineId)) document.getElementById(tmpPolylineId).removeAttribute("id");
    let data = {
      uuid: window.uuid,
      line: polyline[index],
      color: color
    };
    window.socket.send(JSON.stringify(data));
  }
  else{
    shapes.draw(event);
  }
  mousedown = false;
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