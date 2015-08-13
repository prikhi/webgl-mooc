(function() {
"use strict";

var canvas;
var gl;
var vertexBuffer;

var points = [];
var drawingPoints = [];

// Drawing Variables
var angleStep = Math.PI / 32.0;
var heightSteps = 10;

// Event Variables
var drawFunction;
var radius;
var height;
var xScale;
var yScale;
var zScale;
var xRotation;
var yRotation;
var zRotation;
var lastClick = [];

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  //  Configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  //  Load shaders and initialize attribute buffers
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    console.log(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  // Create a buffer for the vertices
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 8*Math.pow(8, 8), gl.DYNAMIC_DRAW);

  // Associate out vertex variable with it's data buffer
  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // Handle Inputs
  setEventHandlers();

  // Setup Initial Scene
  resetInputs();
  render();

  function setEventHandlers() {
    // Type Changes
    document.getElementById('sphere').onclick = function(event) {
      drawFunction = sphere;
      render();
    };
    document.getElementById('cone').onclick = function(event) {
      drawFunction = cone;
      render();
    };
    document.getElementById('cylinder').onclick = function(event) {
      drawFunction = cylinder;
      render();
    };
    // Size Changes
    document.getElementById('radius').onchange = function(event) {
      radius = Number(event.target.value) / canvas.width;
      document.getElementById('rad').innerHTML = event.target.value;
      render();
    };
    document.getElementById('height').onchange = function(event) {
      height = Number(event.target.value) / canvas.width;
      document.getElementById('hei').innerHTML = event.target.value;
      render();
    };
    // Position Changes
    canvas.onmousedown = function(event) {
      var x = event.pageX - this.offsetLeft;
      var y = event.pageY - this.offsetTop;
      x = (x - canvas.width / 2.0) / (canvas.width / 2.0);
      y = (canvas.height / 2.0 - y) / (canvas.height / 2.0);

      document.getElementById('xPos').innerHTML = x;
      document.getElementById('yPos').innerHTML = y;
      lastClick = [x, y];
      render();
    };
    // Scaling Changes
    document.getElementById('xScale').onchange = function(event) {
      xScale = Number(event.target.value);
      document.getElementById('xSca').innerHTML = xScale;
      render();
    };
    document.getElementById('yScale').onchange = function(event) {
      yScale = Number(event.target.value);
      document.getElementById('ySca').innerHTML = yScale;
      render();
    };
    document.getElementById('zScale').onchange = function(event) {
      zScale = Number(event.target.value);
      document.getElementById('zSca').innerHTML = zScale;
      render();
    };
    // Scaling Changes
    document.getElementById('xRotation').onchange = function(event) {
      xRotation = Number(event.target.value);
      document.getElementById('xRot').innerHTML = xRotation;
      render();
    };
    document.getElementById('yRotation').onchange = function(event) {
      yRotation = Number(event.target.value);
      document.getElementById('yRot').innerHTML = yRotation;
      render();
    };
    document.getElementById('zRotation').onchange = function(event) {
      zRotation = Number(event.target.value);
      document.getElementById('zRot').innerHTML = zRotation;
      render();
    };
    // Buttons
    document.getElementById('add').onclick = function(event) {
      points = points.concat(transform(drawingPoints));
      resetInputs();
      render();
    };
    document.getElementById('reset').onclick = function(event) {
      points = [];
      resetInputs();
      render();
    };
  }

  function resetInputs() {
    document.getElementById('sphere').checked = true;
    drawFunction = sphere;
    document.getElementById('radius').value = 300;
    radius = 300 / 512.0;
    document.getElementById('rad').innerHTML = 300;
    document.getElementById('height').value = 300;
    height = 300 / 512.0;
    document.getElementById('hei').innerHTML = 300;
    document.getElementById('xPos').innerHTML = 0.0;
    lastClick[0] = 0.0;
    document.getElementById('yPos').innerHTML = 0.0;
    lastClick[1] = 0.0;
    document.getElementById('xScale').value = 1;
    xScale = 1.0;
    document.getElementById('xSca').innerHTML = xScale;
    document.getElementById('yScale').value = 1;
    yScale = 1.0;
    document.getElementById('ySca').innerHTML = yScale;
    document.getElementById('zScale').value = 1;
    zScale = 1.0;
    document.getElementById('zSca').innerHTML = zScale;
    document.getElementById('xRotation').value = 0;
    xRotation = 0;
    document.getElementById('xRot').innerHTML = xRotation;
    document.getElementById('yRotation').value = 0;
    yRotation = 0;
    document.getElementById('yRot').innerHTML = yRotation;
    document.getElementById('zRotation').value = 0;
    zRotation = 0;
    document.getElementById('zRot').innerHTML = zRotation;
  }

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawFunction(radius, height);

    var allPoints = points.concat(transform(drawingPoints));
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(allPoints));

    gl.drawArrays(gl.LINES, 0, allPoints.length);
  }

  function sphere(radius) {
    /* Draw a sphere at (0, 0) with the specified radius, using top & bottoms
    * points and lattitude lines
    */
    var top = [0.0, radius, 0.0, 1.0];
    var bottom = [0.0, -1 * radius, 0.0, 1.0];
    var topPoints = [top];
    var bottomPoints = [bottom];
    var lastTop = null;
    var lastBottom = null;
    for (var theta = 0; theta <= 2 * Math.PI; theta += angleStep) {
      for (var beta = 0; beta < 2 * Math.PI; beta += angleStep) {
        if (lastTop !== null && lastBottom !== null) {
          topPoints.push(lastTop);
          bottomPoints.unshift(lastBottom);
        }
        var x = radius * Math.sin(theta)  * Math.cos(beta);
        var y = radius * Math.cos(theta);
        var z = radius * Math.sin(theta) * Math.sin(beta);
        var topPoint = [x, y, z, 1.0];
        var bottomPoint = [-x, -y, -z, 1.0];
        topPoints.push(topPoint);
        bottomPoints.unshift(bottomPoint);
        lastTop = topPoint;
        lastBottom = bottomPoint;
      }
    }
    drawingPoints = topPoints.concat(bottomPoints);
  }

  function cone(radius, height) {
    /* Draw a cone using longitude lines between a single point at height/2 & a
    * circle at -height/2
    */
    var conePoints = [];
    var top = [0.0, height / 2.0, 0.0, 1.0];
    var lastPoint = null;
    var y = -height / 2.0;
    for (var theta = 0; theta <= 2 * Math.PI; theta += angleStep) {
      var x = radius * Math.sin(theta);
      var z = radius * Math.cos(theta);
      var point = [x, y, z, 1.0];
      if (lastPoint !== null) {
        conePoints.push(lastPoint, point);
      }
      conePoints.push(top, point);
      lastPoint = point;
    }

    drawingPoints = conePoints;
  }

  function cylinder(radius, height) {
    /* Draw a cylinder using longitude lines between two circles */
    var cylinderPoints = [];
    var lastTopPoint = null;
    var lastBottomPoint = null;
    var y = -height / 2.0;
    for (var theta = 0; theta <= 2 * Math.PI + angleStep; theta += angleStep) {
      var x = radius * Math.sin(theta);
      var z = radius * Math.cos(theta);
      var topPoint = [x, y, z, 1.0];
      var bottomPoint = [x, -y, z, 1.0];
      cylinderPoints.push(topPoint, bottomPoint);
      if (lastTopPoint !== null && lastBottomPoint !== null) {
        cylinderPoints.push(lastTopPoint, topPoint,
                            lastBottomPoint, bottomPoint);
      }
      lastTopPoint = topPoint;
      lastBottomPoint = bottomPoint;
    }
    drawingPoints = cylinderPoints;
  }

  function transform(originalPoints) {
    /* Apply the globally-specified transformations to the points */
    var m = mat4();
    var t = translate(lastClick[0], lastClick[1], 0.0);
    m = mult(m, t);
    var rx = rotateX(xRotation);
    m = mult(m, rx);
    var ry = rotateY(yRotation);
    m = mult(m, ry);
    var rz = rotateZ(zRotation);
    m = mult(m, rz);
    var s = scalem(xScale, yScale, zScale);
    m = mult(m, s);
    return originalPoints.map(function(item) {
      return multMatrixVector(m, item);
    });
  }


  function multMatrixVector(matrix, vector) {
    var result = [];
    result[0] = matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2] + matrix[0][3];
    result[1] = matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2] + matrix[1][3];
    result[2] = matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2] + matrix[2][3];
    result[3] = 1.0;
    return result;
  }

  function rotateX(theta) {
    var c = Math.cos(radians(theta));
    var s = Math.sin(radians(theta));

    var rx = mat4(
        1.0,  0.0,  0.0, 0.0,
        0.0,  c,  s, 0.0,
        0.0, -s,  c, 0.0,
        0.0,  0.0,  0.0, 1.0);

    return rx;
  }

  function rotateY(theta) {
    var c = Math.cos(radians(theta));
    var s = Math.sin(radians(theta));

    var ry = mat4(
        c, 0.0, -s, 0.0,
        0.0, 1.0,  0.0, 0.0,
        s, 0.0,  c, 0.0,
        0.0, 0.0,  0.0, 1.0);

    return ry;
  }

  function rotateZ(theta) {
    var c = Math.cos(radians(theta));
    var s = Math.sin(radians(theta));

    var rz = mat4(
        c, -s, 0.0, 0.0,
        s,  c, 0.0, 0.0,
        0.0,  0.0, 1.0, 0.0,
        0.0,  0.0, 0.0, 1.0);

    return rz;
  }

};


})();
