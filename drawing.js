const draw = SVG('drawing');
const shapes = [];
let index = 0;
let shape;
let polyline = [];
let vpolyline = [];
let polytime = [];

let mousedown=false;

const getDrawObject = function() {
  shape = document.getElementById('shape').value;
  //const color = document.getElementById('color').value;
  const option = {
    //stroke: color,
    'stroke-width': 2,
    'fill-opacity': 0,
  };
  switch (shape) {
    case 'mouse paint':
      return draw.polyline().attr(option);
    case 'ellipse':
      return draw.ellipse().attr(option);
    case 'rect':
      return draw.rect().attr(option);
  }
  return null;
}

draw.on('mousedown', function(event) {
  mousedown=true;
  const shape = getDrawObject();
  /*const shape = getDrawObject();
  shapes[index] = shape;
  shape.draw(event);*/
  vpolyline = [];
  vpolyline.push([event.offsetX, event.offsetY]);
  polyline[index] = [];
  polyline[index].push([event.offsetX, event.offsetY]);
  let date = new Date();
  polytime[index] = date.getTime();
});
draw.on('mousemove', event => {
  // if (shape === 'mouse paint' && shapes[index]) {
  //   shapes[index].draw('point', event);
  // }
  //if (Math.random()>0.1) return
  if (shape === 'polyline' && mousedown && vpolyline) {
    let date = new Date();
    let ms = date.getTime();

    vpolyline.push([event.offsetX, event.offsetY]);

    let krivaya = svgPolylines([[0][0]]);
    for (let i = 0; i<index; i++) {
      krivaya += svgPolylines(polyline[i]);
    }
    krivaya+=svgPolylines(vpolyline);
    document.getElementById("SvgjsSvg1001").innerHTML = krivaya;

    if ((ms-polytime[index])*(Math.pow((event.offsetX-polyline[index][polyline[index].length-1][0]), 2) +
        Math.pow((event.offsetY-polyline[index][polyline[index].length-1][1]), 2)) <10000) return;
    else polytime[index]= ms;
    polyline[index].push([event.offsetX, event.offsetY]);
  }
  else if (shape === 'line' && mousedown && polyline[index]) {
    polyline[index][1] = [event.offsetX, event.offsetY];
    let krivaya = svgPolylines([[0][0]]);
    for (let i = 0; i<=index; i++) {
      krivaya += svgPolylines(polyline[i]);
    }
    document.getElementById("SvgjsSvg1001").innerHTML = krivaya;
  }
})
draw.on('mouseup', event => {
  mousedown=false;
  // if (shape === 'mouse paint') {
  //   shapes[index].draw('stop', event);
  // } else {
  //   shapes[index].draw(event);
  // }
  let krivaya = svgPolylines([[0][0]]);
  for (let i = 0; i<=index; i++) {
    krivaya += svgPolylines(polyline[i]);
  }
  document.getElementById("SvgjsSvg1001").innerHTML = krivaya;
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