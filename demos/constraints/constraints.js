// -------------------------------------------------------------------------------------------------------------------------
// Entry point
window.onload = function()
{
	editor.init("Constraints", onInit, onUpdate, onRender);
};

// -------------------------------------------------------------------------------------------------------------------------
// Config
var config =
{
	gravity : { x: 0, y: -9.8, z : 0 }, // ms^2
	pixelsPerMeter : 100
};

// -------------------------------------------------------------------------------------------------------------------------
// Scene
var collisionPlanes = [];
var bodies = [];
var constraints = [];
var physicsEnabled = true;

// -------------------------------------------------------------------------------------------------------------------------
// Init
function onInit()
{
	// Setup boundaries
	collisionPlanes.push(createCollisionPlane({ x: 0, y: -400, z: 0 }, { x: 0, y: 1, z: 0 }));  // top
	collisionPlanes.push(createCollisionPlane({ x: 0, y: 400, z: 0 }, { x: 0, y: -1, z: 0 }));  // bottom
	collisionPlanes.push(createCollisionPlane({ x: -880, y: 0, z: 0 }, { x: 1, y: 0, z: 0 })); // left
	collisionPlanes.push(createCollisionPlane({ x: 880, y: 0, z: 0 }, { x: -1, y: 0, z: 0 })); // right

	// Setup bodies
	bodies.push(createBody({ x: 0, y: 200, z: 0 }, 20, 1, "#ff0000"));
}

// -------------------------------------------------------------------------------------------------------------------------
// Update
function onUpdate(deltaS)
{
	// Update physics
	if(physicsEnabled)
	{
		updatePhysics(deltaS);
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function updatePhysics(deltaS)
{
	// Calculate gravity acceleration
	var gravityAcceleration = config.gravity;

	// Integrate bodies
	for(var bodyIndex = 0; bodyIndex < bodies.length; ++bodyIndex)
	{
		// Apply ongoing forces
		var body = bodies[bodyIndex];
		body.acceleration = gravityAcceleration;

		// Integrate velocity
		body.linearVelocity = vec3.add(body.linearVelocity, vec3.multiplyScalar(body.acceleration, deltaS));

		// Apply drag
		var dragScalar = 1.0 - body.linearDrag;
		body.linearVelocity = vec3.multiplyScalar(body.linearVelocity, dragScalar);

		// Integrate position
		body.position = vec3.add(body.position, vec3.multiplyScalar(body.linearVelocity, config.pixelsPerMeter * deltaS));
	}
}

// -------------------------------------------------------------------------------------------------------------------------
// Render
function onRender(ctx, canvasWidth, canvasHeight, deltaS)
{
	// Clear
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	// Render collision planes
	for(var planeIndex = 0; planeIndex < collisionPlanes.length; ++planeIndex)
	{
		var plane = collisionPlanes[planeIndex];
		var lineDir = vec3.cross(plane.normal, vec3.forward);
		var lineStart = vec3.add(plane.position, vec3.multiplyScalar(lineDir, -10000000));
		var lineEnd = vec3.add(plane.position, vec3.multiplyScalar(lineDir, 10000000));
		editor.drawLine(ctx, lineStart, lineEnd, "#444444", 5);
	}

	// Render bodies
	for(var bodyIndex = 0; bodyIndex < bodies.length; ++bodyIndex)
	{
		var body = bodies[bodyIndex];
		editor.drawCircle(ctx, body.position, body.scale.x, body.renderData.colour, "#000000", 1);
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function createBody(position, scale, mass, colour)
{
	var body =
	{
		position       : position,
		scale          : { x: scale, y: scale, z: 0.0 },
		mass           : mass,
		massInverse    : 1.0 / mass,
		linearVelocity : { x: 0, y: 0, z: 0 },
		linearDrag     : 0.01,
		acceleration   : { x: 0, y: 0, z: 0 },
		renderData     : { colour : colour }
	};
	return body;
}

// -------------------------------------------------------------------------------------------------------------------------

function createCollisionPlane(position, normal)
{
	var safeNormal = vec3.normalise(normal);
	return { position: position, normal: safeNormal };
}

// -------------------------------------------------------------------------------------------------------------------------