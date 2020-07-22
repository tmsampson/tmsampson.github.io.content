// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "./circuit.mjs";
import * as circuit_utils from "./circuit.utils.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Config
const paperLib = "third-party/paperjs/paper-full.js"

// -------------------------------------------------------------------------------------------------------------------------
// Register
circuit.registerRenderer({
	name: "circuit_canvas_renderer",
	description: "Circuit canvas renderer",
	version: "1.0.0.0",
	create: () => new CircuitCanvasRenderer()
});

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class CircuitCanvasRenderer
{
	async load()
	{
		// Load PaperJS dynamically (cannot currently be imported as ES module)
		return await circuit_utils.loadScript(paperLib);
	}

	bindWorkspace(workspace)
	{
		// Get a reference to the canvas object
		var canvas = document.getElementById("circuit_canvas");
		// Create an empty project and a view for the canvas:
		paper.setup(canvas);
		// Create a Paper.js Path to draw a line into it:
		var path = new paper.Path();
		// Give the stroke a color
		path.strokeColor = 'black';
		var start = new paper.Point(400, 400);
		// Move to start and draw a line from there
		path.moveTo(start);
		// Note that the plus operator on Point objects does not work
		// in JavaScript. Instead, we need to call the add() function:
		path.lineTo(start.add([ 200, -50 ]));
		// Draw the view now:
		paper.view.draw();
	}
}

// -------------------------------------------------------------------------------------------------------------------------