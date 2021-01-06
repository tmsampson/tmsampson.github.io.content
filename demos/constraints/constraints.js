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
	maxTimestep : 1 / 30,               // s
	gravity : { x: 0, y: -9.8, z : 0 }, // ms^2
	pixelsPerMeter : 100,
	testRoll: false
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
	var boundaryWidth = 890, boundaryHeight = 400, boundaryColour = "#444444";
	collisionPlanes.push(createCollisionPlane({ x: 0, y: -boundaryHeight, z: 0 }, { x: 0, y: 1, z: 0 }, boundaryColour)); // top
	collisionPlanes.push(createCollisionPlane({ x: 0, y: boundaryHeight, z: 0 }, { x: 0, y: -1, z: 0 }, boundaryColour)); // bottom
	collisionPlanes.push(createCollisionPlane({ x: -boundaryWidth, y: 0, z: 0 }, { x: 0.5, y: 0.5, z: 0 }, boundaryColour));  // left
	collisionPlanes.push(createCollisionPlane({ x: boundaryWidth, y: 0, z: 0 }, { x: -0.5, y: 0.5, z: 0 }, boundaryColour));  // right

	// Setup bodies
	bodies.push(createBody({ x: 0, y: 200, z: 0 }, vec3.zero, 20, 1, 0.8, "#ff0000"));
	bodies.push(createBody({ x: 100, y: 200, z: 0 }, { x: 10, y: 0, z: 0 }, 20, 1, 0.8, "#00ff00"));
	bodies.push(createBody({ x: -100, y: 200, z: 0 }, { x: -10, y: 0, z: 0 }, 20, 1, 0.8, "#0000ff"));
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
	// Clamp timestep
	deltaS = editor.util.min(deltaS, config.maxTimestep);

	// Apply time dilation
	deltaS *= 1.0;

	// Calculate gravity acceleration
	var gravityAcceleration = config.gravity;

	// Integrate bodies
	for(var bodyIndex = 0; bodyIndex < bodies.length; ++bodyIndex)
	{
		// Cache off existing values
		var body = bodies[bodyIndex];
		body.previous.position = body.position;
		body.previous.linearVelocity = body.linearVelocity;

		// Apply ongoing forces
		body.acceleration = gravityAcceleration;

		// Integrate velocity
		body.linearVelocity = vec3.add(body.linearVelocity, vec3.multiplyScalar(body.acceleration, deltaS));

		// Apply drag
		var dragScalar = 1.0 - (body.linearDrag * deltaS);
		body.linearVelocity = vec3.multiplyScalar(body.linearVelocity, dragScalar);

		// Integrate position
		body.position = vec3.add(body.position, vec3.multiplyScalar(body.linearVelocity, config.pixelsPerMeter * deltaS));

		// Solve collisions (planes)
		for(var planeIndex = 0; planeIndex < collisionPlanes.length; ++planeIndex)
		{
			var plane = collisionPlanes[planeIndex];
			var planeToBody = vec3.subtract(body.position, plane.position);
			var distanceToPlane = vec3.dot(planeToBody, plane.normal) - body.scale.x;
			if(distanceToPlane < 0)
			{
				// Snap back to nearest point on correct side of plane
				var posBefore = body.position;
				body.position = vec3.subtract(body.position, vec3.multiplyScalar(plane.normal, distanceToPlane));

				if(config.testRoll)
				{
					// Test (makes roll work)
					var delta = vec3.subtract(body.position, posBefore);
					body.linearVelocity = vec3.add(body.linearVelocity, delta);
				}
				else
				{
					// Apply bounce
					var bounciness = editor.util.max(body.bounciness, 0);
					body.linearVelocity = vec3.reflect(body.linearVelocity, plane.normal);      // bounce
					body.linearVelocity = vec3.multiplyScalar(body.linearVelocity, bounciness); // dampen
				}
			}
		}
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
		editor.drawLine(ctx, lineStart, lineEnd, plane.renderData.colour, 5);
	}

	// Render bodies
	for(var bodyIndex = 0; bodyIndex < bodies.length; ++bodyIndex)
	{
		var body = bodies[bodyIndex];
		editor.drawCircle(ctx, body.position, body.scale.x, body.renderData.colour, "#000000", 1);
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function createBody(position, linearVelocity, scale, mass, bounciness, colour)
{
	var body =
	{
		position       : position,
		scale          : { x: scale, y: scale, z: 0.0 },
		mass           : mass,
		massInverse    : 1.0 / mass,
		linearVelocity : linearVelocity,
		linearDrag     : 0.6, // %age energy lost over 1s
		acceleration   : { x: 0, y: 0, z: 0 },
		bounciness     : bounciness,
		renderData     : { colour : colour },
		previous       : { position: position, linearVelocity: linearVelocity }
	};
	return body;
}

// -------------------------------------------------------------------------------------------------------------------------

function createCollisionPlane(position, normal, colour)
{
	var safeNormal = vec3.normalise(normal);
	return { position: position, normal: safeNormal, renderData: { colour: colour } };
}

// -------------------------------------------------------------------------------------------------------------------------