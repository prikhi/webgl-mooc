"use strict";

var canvas;
var gl;

var points = [];

// User Controlled
var NumTimesToSubdivide = 5;
var Theta = 0;
var DistanceFactor = 1;

function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 8*Math.pow(4, 6), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Set Event Handlers
    document.getElementById('recursionDepth').onchange = function() {
      NumTimesToSubdivide = Number(this.value);
      render();
    }
    document.getElementById('theta').onchange = function() {
      Theta = this.value;
      render();
    }
    document.getElementById('distanceFactor').onchange = function() {
      DistanceFactor = this.value;
      render();
    }

    render();
};
window.onload = init;

function triangle( a, b, c )
{
    points.push( a, b, c );
}

function divideTriangle( a, b, c, count )
{

    // check for end of recursion

    if ( count === 0 ) {
        triangle( a, b, c );
    }
    else {

        //bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // three new triangles

        divideTriangle( a, ab, ac, count );
        divideTriangle( c, ac, bc, count );
        divideTriangle( b, bc, ab, count );
    }
}

function render()
{
    var vertices = [
        vec2( -1, -1 ),
        vec2(  0,  1 ),
        vec2(  1, -1 )
    ];
    points = [];
    divideTriangle( vertices[0], vertices[1], vertices[2],
                    NumTimesToSubdivide);

    rotatePoints(Theta, DistanceFactor);

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}

function rotatePoints(theta, distanceFactor) {
  points = points.map(function(point) {
    var x = point[0], y = point[1];
    var distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    var weightedTheta = theta * distance * distanceFactor;
    var newX = (x * Math.cos(weightedTheta)) - (y * Math.sin(weightedTheta));
    var newY = (x * Math.sin(weightedTheta)) + (y * Math.cos(weightedTheta));
    return [newX, newY];
  });
}
