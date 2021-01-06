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
var bodies = [];
var constraints = [];

// -------------------------------------------------------------------------------------------------------------------------
// Init
function onInit()
{
	bodies.push(createBody({ x: 0, y: 200, z: 0 }, 20, 1, "#ff0000"));
}

// -------------------------------------------------------------------------------------------------------------------------
// Update
function onUpdate(deltaS)
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
		body.linearVelocity = vector.add(body.linearVelocity, vector.multiplyScalar(body.acceleration, deltaS));

		// Integrate position
		body.position = vector.add(body.position, vector.multiplyScalar(body.linearVelocity, config.pixelsPerMeter * deltaS));
	}
}

// -------------------------------------------------------------------------------------------------------------------------
// Render
function onRender(ctx, canvasWidth, canvasHeight, deltaS)
{
	// Clear
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

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