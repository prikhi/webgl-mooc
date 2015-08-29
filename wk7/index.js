(function() {
"use strict";

var canvas;
var gl;
var vertexBuffer;
var normalBuffer;

var conePoints;
var coneNormals;
var cylinderPoints;
var cylinderNormals;

// Drawing Variables
var angleStep = Math.PI / 64.0;
var heightSteps = 10;


// Lights
var enableAmbient = true;
var ambientLevel;
var ambientR;
var ambientG;
var ambientB;

var enableDiffuse = true;
var diffuseLevel;
var diffuseR;
var diffuseG;
var diffuseB;

var enableSpecular = true;
var specularLevel;
var specularR;
var specularG;
var specularB;

var diffuseTheta = Math.PI;
var rotateDiffuse = false;
var specularTheta = 0;
var rotateSpecular = true;

// Material
var materialAmbientR;
var materialAmbientG;
var materialAmbientB;

var materialDiffuseR;
var materialDiffuseG;
var materialDiffuseB;

var materialSpecularR;
var materialSpecularG;
var materialSpecularB;

var materialShininess;

// Global Transforms
var xScale = 1.0;
var yScale = 1.0;
var zScale = 1.0;
var xRotation = 0;
var yRotation = 180;
var zRotation = 0;
var lastClick = [];

// Camera
var cameraM = lookAt(vec3(0.0, 0.35, 1.0),   // eye
                     vec3(0.0, 0.0, 0.0),   // at
                     vec3(0.0, 10.0, 0.0));  // up
var projectionM = ortho(-1.0, 1.0,
                        -1.0, 1.0,
                        -3.0, 3.0);

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  //  Configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  //  Load shaders
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    console.log(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  // Set Projection & Camera Matrices
  var vProjection = gl.getUniformLocation(program, 'uProjectionMatrix');
  gl.uniformMatrix4fv(vProjection, false, flatten(projectionM));
  var vModelView = gl.getUniformLocation(program, 'uModelViewMatrix');
  gl.uniformMatrix4fv(vModelView, false, flatten(cameraM));

  // Setup lighting
  var uShininess = gl.getUniformLocation(program, 'uShininess');
  gl.uniform1f(uShininess, materialShininess);

  // Create a buffer for the vertices
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 8*Math.pow(8, 8), gl.DYNAMIC_DRAW);

  // Associate out vertex variable with it's data buffer
  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // Create a buffer for the normals
  normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 8*Math.pow(8, 8), gl.DYNAMIC_DRAW);

  // Associate our normals variable with it's data buffer
  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  // Event Uniforms
  var uEnableAmbient = gl.getUniformLocation(program, 'uEnableAmbient');
  gl.uniform1i(uEnableAmbient, enableAmbient);

  var uEnableDiffuse = gl.getUniformLocation(program, 'uEnableDiffuse');
  gl.uniform1i(uEnableDiffuse, enableDiffuse);

  var uEnableSpecular = gl.getUniformLocation(program, 'uEnableSpecular');
  gl.uniform1i(uEnableSpecular, enableSpecular);

  // Set Event Handlers
  document.getElementById('enableAmbient').onchange = function(event) {
    enableAmbient = event.target.checked;
    gl.uniform1i(uEnableAmbient, enableAmbient);
  };
  assignOnChange('ambientLevel', recalculateAmbientLight);
  assignOnChange('ambientR', recalculateAmbientLight);
  assignOnChange('ambientG', recalculateAmbientLight);
  assignOnChange('ambientB', recalculateAmbientLight);
  assignOnChange('materialAmbientR', recalculateAmbientLight);
  assignOnChange('materialAmbientG', recalculateAmbientLight);
  assignOnChange('materialAmbientB', recalculateAmbientLight);

  document.getElementById('enableDiffuse').onchange = function(event) {
    enableDiffuse = event.target.checked;
    gl.uniform1i(uEnableDiffuse, enableDiffuse);
  };
  assignOnChange('diffuseLevel', recalculateDiffuseLight);
  assignOnChange('diffuseR', recalculateDiffuseLight);
  assignOnChange('diffuseG', recalculateDiffuseLight);
  assignOnChange('diffuseB', recalculateDiffuseLight);
  assignOnChange('materialDiffuseR', recalculateDiffuseLight);
  assignOnChange('materialDiffuseG', recalculateDiffuseLight);
  assignOnChange('materialDiffuseB', recalculateDiffuseLight);

  document.getElementById('enableSpecular').onchange = function(event) {
    enableSpecular = event.target.checked;
    gl.uniform1i(uEnableSpecular, enableSpecular);
  };
  assignOnChange('specularLevel', recalculateSpecularLight);
  assignOnChange('specularR', recalculateSpecularLight);
  assignOnChange('specularG', recalculateSpecularLight);
  assignOnChange('specularB', recalculateSpecularLight);
  assignOnChange('materialSpecularR', recalculateSpecularLight);
  assignOnChange('materialSpecularG', recalculateSpecularLight);
  assignOnChange('materialSpecularB', recalculateSpecularLight);
  assignOnChange('shininess', recalculateSpecularLight);

  document.getElementById('rotateSpecular').onclick = function(event) {
    rotateSpecular = !rotateSpecular;
  };
  document.getElementById('rotateDiffuse').onclick = function(event) {
    rotateDiffuse = !rotateDiffuse;
  };

  recalculateAmbientLight();
  recalculateDiffuseLight();
  recalculateSpecularLight();

  drawScene();

  function recalculateAmbientLight() {
    ambientLevel = parseValue('ambientLevel');
    ambientR = parseValue('ambientR');
    ambientG = parseValue('ambientG');
    ambientB = parseValue('ambientB');
    var ambient = vec4(ambientR / 255 * ambientLevel,
                       ambientG / 255 * ambientLevel,
                       ambientB / 255 * ambientLevel,
                       1.0);
    materialAmbientR = parseValue('materialAmbientR');
    materialAmbientG = parseValue('materialAmbientG');
    materialAmbientB = parseValue('materialAmbientB');
    var materialAmbient = vec4(
      materialAmbientR / 255,
      materialAmbientG / 255,
      materialAmbientB / 255,
      1.0);
    var ambientProduct = mult(ambient, materialAmbient);
    gl.uniform4fv(gl.getUniformLocation(program, 'uAmbientProduct'),
                  flatten(ambientProduct));
  }

  function recalculateDiffuseLight() {
    diffuseLevel = parseValue('diffuseLevel');
    diffuseR = parseValue('diffuseR');
    diffuseG = parseValue('diffuseG');
    diffuseB = parseValue('diffuseB');
    var diffuse = vec4(diffuseR / 255 * diffuseLevel,
                       diffuseG / 255 * diffuseLevel,
                       diffuseB / 255 * diffuseLevel,
                       1.0);
    materialDiffuseR = parseValue('materialDiffuseR');
    materialDiffuseG = parseValue('materialDiffuseG');
    materialDiffuseB = parseValue('materialDiffuseB');
    var materialDiffuse = vec4(
      materialDiffuseR / 255,
      materialDiffuseG / 255,
      materialDiffuseB / 255,
      1.0);
    var diffuseProduct = mult(diffuse, materialDiffuse);
    gl.uniform4fv(gl.getUniformLocation(program, 'uDiffuseProduct'),
                  flatten(diffuseProduct));
  }

  function recalculateSpecularLight() {
    specularLevel = parseValue('specularLevel');
    specularR = parseValue('specularR');
    specularG = parseValue('specularG');
    specularB = parseValue('specularB');
    var specular = vec4(
      specularR / 255 * specularLevel,
      specularG / 255 * specularLevel,
      specularB / 255 * specularLevel,
      1.0);
    materialSpecularR = parseValue('materialSpecularR');
    materialSpecularG = parseValue('materialSpecularG');
    materialSpecularB = parseValue('materialSpecularB');
    var materialSpecular = vec4(
      materialSpecularR / 255,
      materialSpecularG / 255,
      materialSpecularB / 255,
      1.0);
    var specularProduct = mult(specular, materialSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, 'uSpecularProduct'),
                  flatten(specularProduct));
    materialShininess = parseValue('shininess');
    gl.uniform1f(gl.getUniformLocation(program, 'uShininess'),
                materialShininess);
  }

  function drawScene() {
    lastClick = [-0.3, 0.0];
    var co = cone(0.2, 0.750);
    conePoints = co[0];
    coneNormals = co[1];

    lastClick = [0.3, 0.0];
    var cy = cylinder(0.2, 0.750);
    cylinderPoints = cy[0];
    cylinderNormals = cy[1];

    render();
  }

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform1f(gl.getUniformLocation(program, 'uDiffuseTheta'), diffuseTheta);
    gl.uniform1f(gl.getUniformLocation(program, 'uSpecularTheta'), specularTheta);

    draw(conePoints, coneNormals, gl.TRIANGLE_FAN);
    draw(cylinderPoints, cylinderNormals, gl.TRIANGLE_STRIP);

    if (rotateDiffuse) {
      diffuseTheta = (diffuseTheta + (angleStep / 2)) % (2 * Math.PI);
    }
    if (rotateSpecular) {
      specularTheta = (specularTheta + (angleStep / 2)) % (2 * Math.PI);
    }

    requestAnimFrame(render);
  }

  function draw(points, normals, draw_type) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(normals));

    gl.drawArrays(draw_type, 0, points.length);
  }

  function cone(radius, height) {
    /* Draw a cone using longitude lines between a single point at height/2 & a
    * circle at -height/2
    */
    var top = [0.0, height / 2.0, 0.0, 1.0];

    var conePoints = [top];
    var coneNormals = [normalize(top)];

    var y = -height / 2.0;
    var lastPoint = null;
    for (var theta = 0; theta <= 2 * Math.PI; theta += angleStep) {
      var x = radius * Math.sin(theta);
      var z = radius * Math.cos(theta);
      var point = [x, y, z, 1.0];
      conePoints.push(point);
      if (lastPoint !== null) {
        // Generate normal using top -> last & top -> current
        var lineOne = subtract(point, top);
        var lineTwo = subtract(lastPoint, top);
        var normal = normalize(vec3(cross(lineOne, lineTwo)));
        coneNormals.push(normal);
      } else {
        coneNormals.push(normalize([0.0, y, 0.0]));
      }
      lastPoint = point;
    }

    return [transform(conePoints), coneNormals];
  }

  function cylinder(radius, height) {
    /* Draw a cylinder using longitude lines between two circles */
    var cylinderPoints = [];
    var cylinderNormals = [];
    var lastTopPoint = null;
    var lastBottomPoint = null;
    var y = -height / 2.0;
    for (var theta = 0; theta <= 2 * Math.PI + angleStep; theta += angleStep) {
      var x = radius * Math.sin(theta);
      var z = radius * Math.cos(theta);
      var topPoint = [x, y, z, 1.0];
      var bottomPoint = [x, -y, z, 1.0];
      cylinderPoints.push(topPoint, bottomPoint);
      var normal = normalize(vec3(x, 0.0, z));
      cylinderNormals.push(normal, normal);
      lastTopPoint = topPoint;
      lastBottomPoint = bottomPoint;
    }
    return [transform(cylinderPoints), cylinderNormals];
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

  function parseValue(id) {
    return parseFloat(document.getElementById(id).value);
  }

  function assignOnChange(id, func) {
    document.getElementById(id).onchange = func;
  }

};


})();
