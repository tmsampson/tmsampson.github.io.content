
// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit_render from "../js/circuit.render.mjs";
import * as circuit_utils from "../js/circuit.utils.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// External dependencies
const jqueryMouseWheelPlugin = "third-party/jquery/jquery.mousewheel.min.js";

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
		// Load jquery mousehweel plugin dynamically (cannot currently be imported as ES module)
		if(!await circuit_utils.loadScript(jqueryMouseWheelPlugin))
		{
			console.error("Failed to load jQuery mouse wheel plugin");
			return false;
		}

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

	viewPositionToWorkspacePosition(workspace, viewPosition)
	{
		// For each workspace renderer...
		for(var i = 0; i < this.workspaceRenderers.length; ++i)
		{
			var workspaceRenderer = this.workspaceRenderers[i];
			if(workspaceRenderer.workspace == workspace)
			{
				// Ask workspace renderer to map view position
				return workspaceRenderer.viewPositionToWorkspacePosition(viewPosition);
			}
		}

		// Could not find renderer for this workspace, return unmodified view position
		return viewPosition;
	}

	
	// ---------------------------------------------------------------------------------------------------------------------

	workspacePositionToViewPosition(workspace, viewPosition)
	{
		// For each workspace renderer...
		for(var i = 0; i < this.workspaceRenderers.length; ++i)
		{
			var workspaceRenderer = this.workspaceRenderers[i];
			if(workspaceRenderer.workspace == workspace)
			{
				// Ask workspace renderer to map workspace position
				return workspaceRenderer.workspacePositionToViewPosition(viewPosition);
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
		canvas.on('mousewheel', (e) => this.onCanvasMouseScroll(e));

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
			var workspacePos = { x: componentPosition.x - 10, y: componentPosition.y - 10 };
			var viewPos = this.workspacePositionToViewPosition(workspacePos);
			ctx.fillStyle = (component.descriptor.name == "nand")? "blue" : "green";
			ctx.fillRect(viewPos.x, viewPos.y, 20 * this.view.scale, 20 * this.view.scale);
		}
	}

	// ---------------------------------------------------------------------------------------------------------------------

	onCanvasMouseDown(e)
	{
		switch(e.which)
		{
			case 1:
			{
				break;
			}
			case 2:
			{
				this.startPanning(e.pageX, e.pageY);
				break;
			}
			case 3:
			{
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

	onCanvasMouseScroll(e)
	{
		var scrollY = (e.deltaY * e.deltaFactor) / 300;
		this.modifyZoom(scrollY);
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
		this.view.focus.x += delta.x * (1 / this.view.scale );
		this.view.focus.y += delta.y * (1 / this.view.scale );

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

	modifyZoom(zoomAmount)
	{
		this.view.scale *= (1 + zoomAmount);
	}

	// ---------------------------------------------------------------------------------------------------------------------

	viewPositionToWorkspacePosition(viewPosition)
	{
		var focus = this.view.focus, scale = this.view.scale;
		var canvasCentre = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
		var workspacePostion = { x: viewPosition.x - canvasCentre.x, y: viewPosition.y - canvasCentre.y };
		workspacePostion.x /= scale; workspacePostion.y /= scale;     // Remove zoom
		workspacePostion.x -= focus.x; workspacePostion.y -= focus.y; // Remove pan
		return { x: workspacePostion.x + canvasCentre.x, y: workspacePostion.y + canvasCentre.y };
	}

	// ---------------------------------------------------------------------------------------------------------------------

	workspacePositionToViewPosition(workspacePosition)
	{
		var focus = this.view.focus, scale = this.view.scale;
		var canvasCentre = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
		var viewPosition = { x: workspacePosition.x - canvasCentre.x, y: workspacePosition.y - canvasCentre.y }
		viewPosition.x += focus.x; viewPosition.y += focus.y; // Apply pan
		viewPosition.x *= scale; viewPosition.y *= scale;     // Apply zoom
		return { x: viewPosition.x + canvasCentre.x, y: viewPosition.y + canvasCentre.y };
	}

	// ---------------------------------------------------------------------------------------------------------------------
}

// -------------------------------------------------------------------------------------------------------------------------