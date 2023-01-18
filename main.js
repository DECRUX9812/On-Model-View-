const vert = `

attribute vec3 position;
attribute vec3 normal;
attribute vec3 color;

uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 normalMatrix;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vColor;

void main() {

	vec4 transformedPos = modelMatrix * vec4( position, 1.0 );

	vPosition = transformedPos.xyz;
	vNormal = vec3( normalMatrix * vec4( normal, 1.0 ) );
	vColor = color;

	gl_Position = projectionMatrix * viewMatrix * transformedPos;

}

`;

const frag = `

precision mediump float;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vColor;

void main() {

	vec3 lightPos = vec3( - 5.0, 1.0, 7.0 );
	vec3 toLight = normalize( lightPos - vPosition );

	float lightInt = 0.5;
	vec3 lightColor = vec3( 1.0, 1.0, 1.0 );

	float ambInt = 0.5;
	vec3 ambColor = vec3( 1.0, 1.0, 1.0 );

	float specInt = 0.5;
	vec3 specColor = vec3( 1.0, 1.0, 1.0 );

	float factor = max( 0.0, dot( vNormal, toLight ) );
	vec3 light = ambInt * ambColor + factor * lightInt * lightColor;

	gl_FragColor = vec4( vColor * light, 1.0 );

}

`;

let canvas, gl;

let attributes, uniforms;
let objects;

let animationType;
let animation;

init();
animate();

function init() {

	animation = 0;
	animationType = 0;

	canvas = document.createElement( 'canvas' );

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	document.body.appendChild( canvas );

	gl = canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' );

	gl.viewport( 0, 0, canvas.width, canvas.height );

	if ( ! gl ) {

		throw new Error( 'Error getting WebGL context.' );

	}

	const vertexShader = gl.createShader( gl.VERTEX_SHADER );

	gl.shaderSource( vertexShader, vert );
	gl.compileShader( vertexShader );

	if ( ! gl.getShaderParameter( vertexShader, gl.COMPILE_STATUS ) ) {

		throw new Error( 'Error compiling vertex shader. ' + gl.getShaderInfoLog( vertexShader ) );

	}

	const fragmentShader = gl.createShader( gl.FRAGMENT_SHADER );

	gl.shaderSource( fragmentShader, frag );
	gl.compileShader( fragmentShader );

	if ( ! gl.getShaderParameter( fragmentShader, gl.COMPILE_STATUS ) ) {

		throw new Error( 'Error compiling fragment shader. ' + gl.getShaderInfoLog( fragmentShader ) );

	}

	const program = gl.createProgram();

	gl.attachShader( program, vertexShader );
	gl.attachShader( program, fragmentShader );
	
	gl.linkProgram( program );

	gl.deleteShader( vertexShader );
	gl.deleteShader( fragmentShader );

	if ( ! gl.getProgramParameter( program, gl.LINK_STATUS ) ) {

		throw new Error( 'Error linking program. ' + gl.getProgramInfoLog( program ) );

	}

	gl.useProgram( program );

	gl.enable( gl.DEPTH_TEST );
	gl.enable( gl.CULL_FACE )

	gl.clearColor( 0, 0, 0, 1 );

	attributes = {
		position: gl.getAttribLocation( program, 'position' ), 
		normal: gl.getAttribLocation( program, 'normal' ), 
		color: gl.getAttribLocation( program, 'color' )
	};

	uniforms = {
		projectionMatrix: gl.getUniformLocation( program, 'projectionMatrix' ), 
		modelMatrix: gl.getUniformLocation( program, 'modelMatrix' ), 
		viewMatrix: gl.getUniformLocation( program, 'viewMatrix' ), 
		normalMatrix: gl.getUniformLocation( program, 'normalMatrix' )
	};

	console.log( { attributes, uniforms } );

	objects = [];

	createPlane();

	createBox( [ 1.5, 1.5, 0 ], [ 1, 3, 1 ] );
	createBox( [ - 1.5, 0.75, 0 ], [ 1, 1.5, 1 ] );
	createBox( [ 0, 0.5, 1.5 ], [ 2, 1, 1 ] );
	createBox( [ 0, 0.5, - 1.5 ], [ 2, 1, 1 ] );

	initSphere();

	window.addEventListener( 'resize', onWindowResize, false );

}

function createPlane() {

	const positions = [ - 5, 0, - 5, - 5, 0, 5, 5, 0, 5, - 5, 0, - 5, 5, 0, 5, 5, 0, - 5 ];

	const normals = [ 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0 ];

	const color = [ Math.random(), Math.random(), Math.random() ];

	let colors = [];

	for ( let i = 0; i < 6; i ++ ) {

		colors = colors.concat( color );

	}

	objects.push( {
		position: [ 0, 0, 0 ], 
		rotation: [ 0, 0, 0 ], 
		scale: [ 1, 1, 1 ],
		buffers: {
			position: createBuffer( new Float32Array( positions ) ), 
			normal: createBuffer( new Float32Array( normals ) ), 
			color: createBuffer( new Float32Array( colors ) )
		}, 
		vertexCount: positions.length / 3
	} );

}

function initSphere() {
	var SPHERE_DIV = 6;
	var i, ai, si, ci;
	var j, aj, sj, cj;
	var p1, p2;
	var vertices = [],indices = [];
	for (j = 0; j <= SPHERE_DIV; j++) 
		{
		aj = j * Math.PI / SPHERE_DIV;
		sj = Math.sin(aj);
		cj = Math.cos(aj);
		for (i = 0; i <= SPHERE_DIV; i++) 
		{
			ai = i * 2 * Math.PI / SPHERE_DIV;
			si = Math.sin(ai);
			ci = Math.cos(ai);
			vertices.push(si * sj);  // X
			vertices.push(cj);       // Y
			vertices.push(ci * sj);  // Z
		}
	} 

	for (j = 0; j < SPHERE_DIV; j++)
	{
		for (i = 0; i < SPHERE_DIV; i++)
		{
			p1 = j * (SPHERE_DIV+1) + i;
			p2 = p1 + (SPHERE_DIV+1);
			indices.push(p1);
			indices.push(p2);
			indices.push(p1 + 1);
			indices.push(p1 + 1);
			indices.push(p2);
			indices.push(p2 + 1);
		}
	}

	const colors = [];

	for ( let i = 0; i < indices.length / 3; i ++ ) {

		const r = 1 || Math.random();
		const g = 0.5 || Math.random();
		const b = 0.1 || Math.random();

		colors.push( 
			r, g, b, 
			r, g, b, 
			r, g, b, 
		);

	}

	const vertexBuffer = createBuffer( new Float32Array( vertices ) );

	objects.push( {
		position: [ 0, 1, 0 ], 
		scale: [ 1, 1, 1 ], 
		rotation: [ 0, 0, 0 ], 
		buffers: {
			position: vertexBuffer, 
			color: createBuffer( new Float32Array( colors ) ), 
			normal: vertexBuffer, 
			index: createBuffer( new Uint16Array( indices ), true )
		}, 
		vertexCount: indices.length
	} );

} 

function createBox( position, scale ) {

	const positions = [
		// Front face
		- 1.0, - 1.0,  1.0,
		1.0, - 1.0,  1.0,
		1.0,  1.0,  1.0,
		- 1.0,  1.0,  1.0,

		// Back face
		- 1.0, - 1.0, - 1.0,
		- 1.0,  1.0, - 1.0,
		1.0,  1.0, - 1.0,
		1.0, - 1.0, - 1.0,

		// Top face
		- 1.0,  1.0, - 1.0,
		- 1.0,  1.0,  1.0,
		1.0,  1.0,  1.0,
		1.0,  1.0, - 1.0,

		// Bottom face
		- 1.0, - 1.0, - 1.0,
		1.0, - 1.0, - 1.0,
		1.0, - 1.0,  1.0,
		- 1.0, - 1.0,  1.0,

		// Right face
		1.0, - 1.0, - 1.0,
		1.0,  1.0, - 1.0,
		1.0,  1.0,  1.0,
		1.0, - 1.0,  1.0,

		// Left face
		- 1.0, - 1.0, - 1.0,
		- 1.0, - 1.0,  1.0,
		- 1.0,  1.0,  1.0,
		- 1.0,  1.0, - 1.0,
	];

	for ( let i = 0; i < positions.length; i ++ ) {

		positions[ i ] *= 0.5;

	}

	const faceColors = [];

	for ( let i = 0; i < 6; i ++ ) {

		faceColors.push( [ Math.random(), Math.random(), Math.random() ] );

	}

	// Convert the array of colors into a table for all the vertices.

	let colors = [];

	for (var j = 0; j < faceColors.length; ++j) {
		const c = faceColors[j];

		// Repeat each color four times for the four vertices of the face
		colors = colors.concat(c, c, c, c);
	}

	const indices = [
		0,  1,  2,      0,  2,  3,    // front
		4,  5,  6,      4,  6,  7,    // back
		8,  9,  10,     8,  10, 11,   // top
		12, 13, 14,     12, 14, 15,   // bottom
		16, 17, 18,     16, 18, 19,   // right
		20, 21, 22,     20, 22, 23,   // left
	];

	const faceNormals = [
		[ 0, 0, 1 ], 
		[ 0, 0, - 1 ], 
		[ 0, 1, 0 ], 
		[ 0, - 1, 0 ], 
		[ 1, 0, 0 ], 
		[ - 1, 0, 0 ]
	];

	let normals = [];

	for (var j = 0; j < faceNormals.length; ++j) {
		const c = faceNormals[j];

		normals = normals.concat(c, c, c, c);
	}

	objects.push( {
		position,
		scale, 
		rotation: [ 0, 0, 0 ], 
		buffers: {
			position: createBuffer( new Float32Array( positions ) ), 
			normal: createBuffer( new Float32Array( normals ) ), 
			color: createBuffer( new Float32Array( colors ) ), 
			index: createBuffer( new Uint16Array( indices ), true )
		}, 
		vertexCount: indices.length
	} );

}

function createBuffer( data, isIndex ) {

	const type = isIndex !== true ? gl.ARRAY_BUFFER : gl.ELEMENT_ARRAY_BUFFER;

	const buffer = gl.createBuffer();

	gl.bindBuffer( type, buffer );

	gl.bufferData( type, data, gl.STATIC_DRAW );

	return buffer;

}

function onWindowResize() {

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl.viewport( 0, 0, canvas.width, canvas.height );

	render();

}

function animate() {

	render();

	window.requestAnimationFrame( animate );

}

function render() {

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	const viewMatrix = [];

	const now = Date.now() / 1000;

	let camPos;

	animation += 0.005;

	if ( animation > 1 ) {

		animationType ++;
		animationType %= 2;

		animation = 0;

	}

	if ( animationType === 0 ) {

		camPos = [ - 6 + animation * 12, 8, 6 ];

	} else {

		const angle = Math.PI * animation;
		const r = 10;

		camPos = [ Math.sin( angle ) * r, ( 1 - animation ) * 5, Math.cos( angle ) * r ];

	}

	mat4.lookAt( viewMatrix, camPos, [ 0, 0.75, 0 ], [ 0, 1, 0 ] );

	const projectionMatrix = [];

	// mat4.perspective( projectionMatrix, 60 * Math.PI / 180, canvas.width / canvas.height, 0.1, 1000 );

	const aspect = canvas.width / canvas.height;

	mat4.ortho( projectionMatrix, - 8 * aspect, 8 * aspect, - 8, 8, 0, 100 );

	gl.uniformMatrix4fv( uniforms.projectionMatrix, false, projectionMatrix );
	gl.uniformMatrix4fv( uniforms.viewMatrix, false, viewMatrix );
	
	for ( let i = 0; i < objects.length; i ++ ) {

		const object = objects[ i ];

		for ( let name in attributes ) {

			gl.enableVertexAttribArray( attributes[ name ] );

			gl.bindBuffer( gl.ARRAY_BUFFER, object.buffers[ name ] );

			gl.vertexAttribPointer( attributes[ name ], 3, gl.FLOAT, false, 0, 0 );

		}

		const modelMatrix = mat4.create();

		mat4.identity( modelMatrix );
		
		mat4.translate( modelMatrix, modelMatrix, object.position );
		
		mat4.rotateX( modelMatrix, modelMatrix, object.rotation[ 0 ] );
		mat4.rotateY( modelMatrix, modelMatrix, object.rotation[ 1 ] );
		mat4.rotateZ( modelMatrix, modelMatrix, object.rotation[ 2 ] );

		mat4.scale( modelMatrix, modelMatrix, object.scale );

		gl.uniformMatrix4fv( uniforms.modelMatrix, false, modelMatrix );

		const normalMatrix = [];

		const modelViewMatrix = [];
		mat4.multiply( modelViewMatrix, viewMatrix, modelMatrix );

		mat4.invert( normalMatrix, modelViewMatrix );
		mat4.transpose( normalMatrix, normalMatrix );

		gl.uniformMatrix4fv( uniforms.normalMatrix, false, normalMatrix );

		if ( object.buffers.index ) {

			gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, object.buffers.index );

			gl.drawElements( gl.TRIANGLES, object.vertexCount, gl.UNSIGNED_SHORT, 0 );

		} else {

			gl.drawArrays( gl.TRIANGLES, 0, object.vertexCount );

		}

	}

}