(function() {
"use strict";

var canvas;
var gl;

var points = [
    vec2( -1, -1 ),
    vec2(  0,  1 ),
    vec2(  1, -1 )
];
var colors = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
];

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "maxwell-fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Handle Events
    document.getElementById('selectSingle').onclick = function() { singleColor(); };
    document.getElementById('selectMaxwell').onclick = function() { maxwellColor(); };
    document.getElementById('selectVibrant').onclick = function() { vibrantColor(); };
    document.getElementById('selectLuminence').onclick = function() { luminenceColor(); };

    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

/* Show a red Triangle */
function singleColor() {
    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "red-fragment-shader");
    gl.useProgram(program);

    render();
}

/* Show a Maxwell Triangle */
function maxwellColor() {
    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "maxwell-fragment-shader");
    gl.useProgram(program);

    render();
}

/* Show a Maxwell Triangle with scaled values */
function vibrantColor() {
    //  Load shaders and initialize attribute buffers
    var program = initShaders(
      gl, "vertex-shader", "vibrant-maxwell-fragment-shader");
    gl.useProgram(program);

    render();
}

/* Show a Maxwell Triangle with luminence values */
function luminenceColor() {
    //  Load shaders and initialize attribute buffers
    var program = initShaders(
      gl, "vertex-shader", "luminence-maxwell-fragment-shader");
    gl.useProgram(program);

    render();
}

})();
