
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
		// Store workspace
		this.workspace = workspace;

		// Create canvas and add to page
		var canvas = $("<canvas id='circuit_canvas' resize></canvas>");

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
			ctx.fillStyle = (component.descriptor.name == "nand")? "blue" : "green";
			ctx.fillRect(componentPosition.x-10, componentPosition.y-10, 20, 20);
		}
	}

	// ---------------------------------------------------------------------------------------------------------------------

	convertViewPosition(viewPosition)
	{
		return { x: viewPosition.x + 100, y: viewPosition.y };
	}

	// ---------------------------------------------------------------------------------------------------------------------
}

// -------------------------------------------------------------------------------------------------------------------------