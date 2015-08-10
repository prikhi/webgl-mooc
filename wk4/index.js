(function() {
"use strict";

var canvas;
var gl;
var vertexBuffer;

var points = [];

var strokeWidth = 5.0;

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.lineWidth(strokeWidth);

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      console.log(gl.getProgramInfoLog(program));
    gl.useProgram( program );

    // Load the data into the GPU
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*Math.pow(8, 8), gl.DYNAMIC_DRAW);

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Handle Events
    var isMouseDown = false;
    var lastPosition = null;
    canvas.onmousedown = function() { isMouseDown = true; };
    canvas.onmouseup = function() { isMouseDown = false; };
    canvas.onmousemove = function(event) {
      if (isMouseDown) {
        var x = event.pageX - this.offsetLeft;
        var y = event.pageY - this.offsetTop;
        x = (x - canvas.width / 2.0) / (canvas.width / 2.0);
        y = (canvas.height / 2.0 - y) / (canvas.height / 2.0);

        var point = [x, y];
        lastPosition = lastPosition === null ? point : lastPosition;

        points.push(lastPosition);
        points.push(point);
        lastPosition = point;

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
        render();
      } else {
        lastPosition = null;
      }
    };
    document.getElementById('strokeWidth').onchange = function(event) {
      strokeWidth = event.target.value;
      gl.lineWidth(strokeWidth);
      render();
    };

    render();
};

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.LINES, 0, points.length);
}


})();
