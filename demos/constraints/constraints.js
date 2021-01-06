// -------------------------------------------------------------------------------------------------------------------------
// Config
var config =
{
	renderUpdate : 16, // ms
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
	console.log("update");
	resizeCanvas();

	// Schedule next update
	setTimeout(update, config.renderUpdate);
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