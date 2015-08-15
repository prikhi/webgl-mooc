(function () {
"use strict";

var canvas;
var gl;

var points = [];
var vertices = initialVertices(0.0, 0.0, 1.0);

// User Controlled
var NumTimesToSubdivide = 5;
var Theta = 0;
var DistanceFactor = 1;

function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 8*Math.pow(8, 8), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var uTheta = gl.getUniformLocation(program, "uTheta");
    gl.uniform1f(uTheta, Theta);
    var uFactor = gl.getUniformLocation(program, "uFactor");
    gl.uniform1f(uFactor, DistanceFactor);

    // Set Event Handlers
    document.getElementById('recursionDepth').onchange = function() {
      NumTimesToSubdivide = Number(this.value);
      render();
    };
    document.getElementById('theta').onchange = function() {
      Theta = this.value;
      gl.uniform1f(uTheta, Theta);
      render();
    };
    document.getElementById('distanceFactor').onchange = function() {
      DistanceFactor = this.value;
      gl.uniform1f(uFactor, DistanceFactor);
      render();
    };

    render();
}
window.onload = init;

function triangle(a, b, c)
{
    points.push(a, b, c);
}

function divideTriangle(a, b, c, count)
{

    // check for end of recursion

    if (count === 0) {
        triangle(a, b, c);
    }
    else {

        //bisect the sides

        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        --count;

        // three new triangles
        divideTriangle(a, ab, ac, count);
        divideTriangle(c, ac, bc, count);
        divideTriangle(b, bc, ab, count);
    }
}

function render()
{
    points = [];
    divideTriangle(vertices[0], vertices[1], vertices[2], NumTimesToSubdivide);

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

function initialVertices(centerX, centerY, radius) {
  /* Return the points for an equilateral triangle that inscribes the
  * specified circle
  */
  var pointA = [centerX, centerY + radius];
  var pointB = [
    pointA[0] * Math.cos(radians(120)) - pointA[1] * Math.sin(radians(120)),
    pointA[0] * Math.sin(radians(120)) + pointA[1] * Math.cos(radians(120))
  ];
  var pointC = [
    pointA[0] * Math.cos(radians(240)) - pointA[1] * Math.sin(radians(240)),
    pointA[0] * Math.sin(radians(240)) + pointA[1] * Math.cos(radians(240))
  ];
  return [pointA, pointB, pointC];
}


})();
