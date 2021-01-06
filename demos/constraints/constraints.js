// -------------------------------------------------------------------------------------------------------------------------
// Config
var config =
{
	renderUpdate : 16, // ms
	zoom         :
	{
		min         : 0.2,
		max         : 25.0,
		speed       : 0.15,
		inputScalar : -0.1
	}
};

// -------------------------------------------------------------------------------------------------------------------------
// Globals
var global =
{
	canvasContainer : null,
	canvas          : null,
	ctx             : null
};

// -------------------------------------------------------------------------------------------------------------------------
// Constants
var constants =
{
	tau             : (2 * Math.PI),
	mouse_btn_right : 2
};

// -------------------------------------------------------------------------------------------------------------------------
// View
var view =
{
	focus      : { x: 0, y: 0 },
	zoom       : 1.0,
	zoomTarget : 1.0,
	panning    :
	{
		isActive : false,
		origin   : { x: 0, y: 0 },
	}
};

// -------------------------------------------------------------------------------------------------------------------------
// Cursor
var cursor =
{
	positionView   : { x: 0, y: 0 },
	positionCanvas : { x: 0, y: 0 },
};

// -------------------------------------------------------------------------------------------------------------------------
// Init
window.onload = function()
{
	init();

	// Kick-off update
	setTimeout(update, config.renderUpdate);
};

// -------------------------------------------------------------------------------------------------------------------------

function init()
{
	// Setup toolbox
	var toolbox = $("#editor_toolbox");
	toolbox.dialog({ width: 200, closeOnEscape: false, dialogClass: "noclose" });
	$("div[aria-describedby='editor_toolbox']").offset({ top: 20, left: 20 });

	// Setup canvas container
	global.canvasContainer = $("#editor_canvas_container");
	resizeCanvasContainer();

	// Create canvas
	var canvasElement = $("<canvas id='editor_canvas' resize></canvas>");

	// Bind canvas events
	canvasElement.on("mousedown", (e) => onCanvasMouseDown(e));
	canvasElement.on("mouseup", (e) => onCanvasMouseUp(e));
	canvasElement.on("mousemove", (e) => onCanvasMouseMove(e));
	canvasElement.on("wheel", (e) => onCanvasMouseWheel(e));

	// Store canvas and draw context
	global.canvas = canvasElement[0];
	global.ctx = global.canvas.getContext("2d");

	// Add canvas to container
	global.canvasContainer.append(global.canvas);

	// Make sure canvas container resizes with screen
	$(window).resize(() => resizeCanvasContainer());
}

// -------------------------------------------------------------------------------------------------------------------------

function update()
{
	// Editor
	resizeCanvas();

	// Update smooth zoom
	view.zoom = (view.zoomTarget * config.zoom.speed) + (view.zoom * (1.0 -  config.zoom.speed));

	// Update

	// Render
	render();

	// Schedule next update
	setTimeout(update, config.renderUpdate);
}

// -------------------------------------------------------------------------------------------------------------------------

function render()
{
	// Clear canvas
	var ctx = global.ctx;
	ctx.clearRect(0, 0, global.canvas.width, global.canvas.height);

	var canvasPos = worldToCanvas({ x: 0, y: 0 });
	ctx.fillStyle = "#ff0000";
	ctx.strokeStyle = "#000000";
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.arc(canvasPos.x, canvasPos.y, 20 * view.zoom, 0.0, constants.tau);
	ctx.fill(); ctx.stroke();
}

// ---------------------------------------------------------------------------------------------------------------------

function onCanvasMouseDown(e)
{
	if(e.which == constants.mouse_btn_right) { panningBegin(e.pageX, e.pageY); }
}

// ---------------------------------------------------------------------------------------------------------------------

function onCanvasMouseUp(e)
{
	if(e.which == constants.mouse_btn_right) { panningEnd(e.pageX, e.pageY); }
}

// ---------------------------------------------------------------------------------------------------------------------

function onCanvasMouseMove(e)
{
	cursor.positionView = { x: e.pageX, y: e.pageY };
	cursor.positionCanvas =canvasToWorld(cursor.positionView);
	if(view.panning.isActive)
	{
		panningUpdate(e.pageX, e.pageY);
	}
}

// ---------------------------------------------------------------------------------------------------------------------

function onCanvasMouseWheel(e)
{
	var zoomAmount = e.originalEvent.deltaY * config.zoom.inputScalar;
	view.zoomTarget = clamp(view.zoomTarget * (1 + zoomAmount), config.zoom.min, config.zoom.max);
}

// ---------------------------------------------------------------------------------------------------------------------

function panningBegin(x, y)
{
	view.panning.isActive = true;
	view.panning.origin = { x: x, y: y };
	global.canvas.style.cursor = "move";
}

// ---------------------------------------------------------------------------------------------------------------------

function panningUpdate(x, y)
{
	// Apply pan offset to view
	var delta = { x: x - view.panning.origin.x, y: y - view.panning.origin.y };
	view.focus.x += delta.x * (1 / view.zoom );
	view.focus.y += delta.y * (1 / view.zoom );

	// Update pan origin
	view.panning.origin.x = x;
	view.panning.origin.y = y;
}

// ---------------------------------------------------------------------------------------------------------------------

function panningEnd()
{
	view.panning.isActive = false;
	global.canvas.style.cursor = "default";
}

// ---------------------------------------------------------------------------------------------------------------------

function worldToCanvas(worldPosition)
{
	var canvasCentre = { x: global.canvas.width * 0.5, y: global.canvas.height * 0.5 };
	var canvasX = canvasCentre.x + (worldPosition.x + view.focus.x) * view.zoom;
	var canvasY = canvasCentre.y + (worldPosition.y + view.focus.y) * view.zoom;
	return { x: canvasX, y: canvasY };
}

// -------------------------------------------------------------------------------------------------------------------------

function canvasToWorld(canvasPosition)
{
	var canvasCentre = { x: global.canvas.width * 0.5, y: global.canvas.height * 0.5 };
	var worldX = ((canvasPosition.x - canvasCentre.x) / view.zoom) - view.focus.x;
	var worldY = ((canvasPosition.y - canvasCentre.y) / view.zoom) - view.focus.y;
	return { x: worldX, y: worldY };
}

// -------------------------------------------------------------------------------------------------------------------------

function resizeCanvasContainer()
{
	global.canvasContainer.css("width", window.innerWidth);
	global.canvasContainer.css("height", window.innerHeight);
}

// -------------------------------------------------------------------------------------------------------------------------

function resizeCanvas()
{
	global.canvas.width = global.canvasContainer.width();
	global.canvas.height = global.canvasContainer.height();
}

// -------------------------------------------------------------------------------------------------------------------------
// Maths
function clamp(x, min, max)
{
	return Math.min(Math.max(x, min), max);
}

// -------------------------------------------------------------------------------------------------------------------------