
// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit_render from "../js/circuit.render.mjs";
import * as circuit_utils from "../js/circuit.utils.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Self registration
circuit_render.registerRenderer({
	name: "circuit_canvas_renderer",
	description: "Circuit canvas renderer",
	version: "1.0.0.0",
	create: () => new CircuitCanvasRenderer()
});

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class CircuitCanvasRenderer
{
	// ---------------------------------------------------------------------------------------------------------------------

	async load()
	{
		// Setup workspace renderer container
		this.workspaceRenderers = [];

		// Start rendering
		this.startRendering();
		return true;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	startRendering(e)
	{
		var workspaceRenderers = this.workspaceRenderers;
		function onRender()
		{
			// For each workspace renderer...
			for(var i = 0; i < workspaceRenderers.length; ++i)
			{
				// Render workspace
				workspaceRenderers[i].onRender(e);
			}

			// Request next render callback
			window.requestAnimationFrame(onRender);

		};

		// Request first render callback
		window.requestAnimationFrame(onRender);
	}

	// ---------------------------------------------------------------------------------------------------------------------

	onCreateWorkspace(workspace, renderContainer)
	{
		var workspaceRenderer = new CircuitCanvasWorkspaceRenderer(workspace, renderContainer);
		this.workspaceRenderers.push(workspaceRenderer);
	}

	// ---------------------------------------------------------------------------------------------------------------------

	convertViewPosition(workspace, viewPosition)
	{
		// For each workspace renderer...
		for(var i = 0; i < this.workspaceRenderers.length; ++i)
		{
			var workspaceRenderer = this.workspaceRenderers[i];
			if(workspaceRenderer.workspace == workspace)
			{
				// Ask workspace renderer to map view position
				return workspaceRenderer.convertViewPosition(viewPosition);
			}
		}

		// Could not find renderer for this workspace, return unmodified view position
		return viewPosition;
	}

	// ---------------------------------------------------------------------------------------------------------------------
}

// -------------------------------------------------------------------------------------------------------------------------

class CircuitCanvasWorkspaceRenderer
{
	// ---------------------------------------------------------------------------------------------------------------------

	constructor(workspace, renderContainer)
	{
		// Init state
		this.isPanning = false;
		this.panOrigin = { }
		this.view = { focus: { x: 0, y: 0 }, scale : 1.0 };

		// Store workspace
		this.workspace = workspace;

		// Create canvas
		var canvas = $("<canvas id='circuit_canvas' resize></canvas>");

		// Bind canvas events
		canvas.on("mousedown", (e) => this.onCanvasMouseDown(e));
		canvas.on("mouseup", (e) => this.onCanvasMouseUp(e));
		canvas.on("mousemove", (e) => this.onCanvasMouseMove(e));

		// Store canvas and context
		this.canvas = canvas[0];
		this.ctx = this.canvas.getContext('2d');

		// Resize canvas
		this.canvas.width  = window.innerWidth;
		this.canvas.height = window.innerHeight;

		// Add canvas to page
		renderContainer.append(this.canvas);
	}

	// ---------------------------------------------------------------------------------------------------------------------

	onRender(e)
	{
		// Clear canvas
		var ctx = this.ctx;
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Render components
		var components = this.workspace.components;
		for(var i = 0; i < components.length; ++i)
		{
			// Skip components without a position
			var component = components[i];
			var componentPosition = component.args.position;
			if(!componentPosition)
			{
				continue;
			}

			// Draw rectangle
			var x = (componentPosition.x - 10) + this.view.focus.x;
			var y = (componentPosition.y - 10) + this.view.focus.y;
			ctx.fillStyle = (component.descriptor.name == "nand")? "blue" : "green";
			ctx.fillRect(x, y, 20, 20);
		}
	}

	// ---------------------------------------------------------------------------------------------------------------------

	onCanvasMouseDown(e)
	{
		switch(e.which)
		{
			case 2:
			{
				this.startPanning(e.pageX, e.pageY);
				break;
			}
		}
	}

	// ---------------------------------------------------------------------------------------------------------------------

	onCanvasMouseUp(e)
	{
		switch(e.which)
		{
			case 2:
			{
				this.stopPanning();
				break;
			}
		}
	}

	// ---------------------------------------------------------------------------------------------------------------------

	onCanvasMouseMove(e)
	{
		if(this.isPanning)
		{
			this.updatePanning(e.pageX, e.pageY);
		}
	}

	// ---------------------------------------------------------------------------------------------------------------------

	startPanning(x, y)
	{
		this.isPanning = true;
		this.panOrigin = { x: x, y: y };
		this.canvas.style.cursor = "move";
	}

	// ---------------------------------------------------------------------------------------------------------------------

	updatePanning(x, y)
	{
		// Apply pan offset to view
		var delta = { x: x - this.panOrigin.x, y: y - this.panOrigin.y };
		this.view.focus.x += delta.x;
		this.view.focus.y += delta.y;

		// Update pan origin
		this.panOrigin.x = x;
		this.panOrigin.y = y;;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	stopPanning(x, y)
	{
		this.isPanning = false;
		this.canvas.style.cursor = "pointer";
	}
	
	// ---------------------------------------------------------------------------------------------------------------------

	convertViewPosition(viewPosition)
	{
		return { x: viewPosition.x - this.view.focus.x, y: viewPosition.y - this.view.focus.y };
	}

	// ---------------------------------------------------------------------------------------------------------------------
}

// -------------------------------------------------------------------------------------------------------------------------