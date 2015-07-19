(function() {
"use strict";

var canvas;
var gl;

var points = [];

// User Controlled
var NumTimesToSubdivide = 5;
var Theta = 0;

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  //  Configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  //  Load shaders and initialize attribute buffers
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Load the data into the GPU
  var bufferId = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
  gl.bufferData( gl.ARRAY_BUFFER, 8*Math.pow(8, 8), gl.STATIC_DRAW );

  // Associate out shader variables with our data buffer
  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
  var uTheta = gl.getUniformLocation(program, "uTheta");
  gl.uniform1f(uTheta, Theta);

  // Set Event Handlers
  document.getElementById('recursionDepth').onchange = function() {
    NumTimesToSubdivide = Number(this.value);
    render();
  };
  document.getElementById('theta').onchange = function() {
    Theta = Number(this.value);
    gl.uniform1f(uTheta, Theta);
    render();
  };

  render();
};

function render() {
  var t1 = new Date();
  var vertices = [
    vec2(-0.651, -0.375),
    vec2(0, 0.75),
    vec2(0.651, -0.375)
  ];
  points = [];
  divideTriangle(vertices[0], vertices[1], vertices[2], NumTimesToSubdivide);

  gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, points.length);
  var t2 = new Date();

  var millisecondDifference = t2.valueOf() - t1.valueOf();
  document.getElementById('renderTime').innerHTML = millisecondDifference;
}

function triangle(a, b, c) {
    points.push(a, b, c);
}

function divideTriangle(a, b, c, count) {
  // check for end of recursion
  if (count === 0) {
    triangle(a, b, c);
  }
  else {
    count--;
    //bisect the sides
    var ab = mix(a, b, 0.5);
    var ac = mix(a, c, 0.5);
    var bc = mix(b, c, 0.5);
    // three new triangles
    divideTriangle(a, ab, ac, count);
    divideTriangle(c, ac, bc, count);
    divideTriangle(b, bc, ab, count);
  }
}

})();

