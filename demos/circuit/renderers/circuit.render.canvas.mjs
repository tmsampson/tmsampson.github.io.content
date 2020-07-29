
// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit_render from "../js/circuit.render.mjs";
import * as circuit_utils from "../js/circuit.utils.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// External dependencies
const jqueryLib = "third-party/jquery/jquery.js";                              // jQuery
const jqueryMouseWheelPlugin = "third-party/jquery/jquery.mousewheel.min.js";  // jQuery mouse wheel plugin

// -------------------------------------------------------------------------------------------------------------------------
// Self registration
circuit_render.registerRenderer({
	name: "circuit_canvas_renderer",
	description: "Circuit canvas renderer",
	version: "1.0.0.0",
	load: () => loadDependencies(),
	create: (workspace, containerElement) => new CircuitCanvasRenderer(workspace, containerElement)
});

// -------------------------------------------------------------------------------------------------------------------------
// Dependencies
async function loadDependencies()
{
	// Load jquery module (if not already loaded)
	if(!window.jQuery && !await circuit_utils.loadScript(jqueryLib))
	{
		console.error("Failed to load jQuery");
		return false;
	}

	// Load jquery mousehweel plugin
	if(!await circuit_utils.loadScript(jqueryMouseWheelPlugin))
	{
		console.error("Failed to load jQuery mouse wheel plugin");
		return false;
	}

	// Ready
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class CircuitCanvasRenderer
{
	// ---------------------------------------------------------------------------------------------------------------------

	constructor(workspace, containerElement)
	{
		// Store workspace
		this.workspace = workspace;

		// Init state
		this.containerElement = containerElement;
		this.isPanning = false;
		this.panOrigin = { }
		this.view = { focus: { x: 0, y: 0 }, zoom : 1.0, targetZoom: 1.0 };
		this.componentUnderCursor = null;

		// Init config
		this.config =
		{
			minZoom: 0.2,
			maxZoom: 25.0,
			zoomSpeed: 0.15,
			gridVisible: true,
			gridSnapSpacing: 100,
			gridSnapRadius: 20
		};

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

		// Resize canvas to match container
		this.updateCanvasSize();

		// Add canvas to page
		containerElement.append(this.canvas);
	}

	// ---------------------------------------------------------------------------------------------------------------------

	updateCanvasSize()
	{
		this.canvas.width = this.containerElement.width();
		this.canvas.height = this.containerElement.height();
	}

	// ---------------------------------------------------------------------------------------------------------------------

	onUpdate(e)
	{
		// Resize canvas to match container
		this.updateCanvasSize();
		
		// Update smooth zoom
		var currentZoom = this.view.zoom, targetZoom = this.view.targetZoom, zoomSpeed = this.config.zoomSpeed;
		this.view.zoom = (targetZoom * zoomSpeed) + (currentZoom * (1.0 - zoomSpeed));
	}

	// ---------------------------------------------------------------------------------------------------------------------

	onRender(e)
	{
		// Clear canvas
		var ctx = this.ctx;
		var viewAABB = { lowerBound: { x: 0, y: 0 }, upperBound: { x: this.canvas.width, y: this.canvas.height } };
		ctx.clearRect(viewAABB.lowerBound.x, viewAABB.lowerBound.y, viewAABB.upperBound.x, viewAABB.upperBound.y);

		// Clear state
		this.componentUnderCursor = null;

		// Render grid snap points?
		if(this.config.gridVisible)
		{
			this.renderGridSnapPoints();
		}

		// Render components
		var zoom = this.view.zoom;
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

			// Skip components without a valid widget
			var widget = component.descriptor.widget;
			if(widget == null)
			{
				continue;
			}

			// Get image name
			var renderImage = widget.getRenderImage(component);

			// Get image descriptor
			var widgetName = widget.descriptor.name;
			var imageDescriptor = widget.descriptor.images[renderImage.image];
			if(imageDescriptor == null || imageDescriptor.loadedImage == null)
			{
				var suggestion = "Please make sure this image is included in the widget descriptor";
				console.error(`Widget '${widgetName}': Image '${widgetImageName}' provided via getImage() was not loaded. ${suggestion}`);
				continue;
			}

			// Calculate widget view AABB
			var widgetSize = { x: renderImage.width, y: renderImage.height };
			var widgetWorkspacePositionBottomLeft = { x: componentPosition.x - (widgetSize.x * 0.5), y: componentPosition.y - (widgetSize.y * 0.5) };
			var widgetViewPositionBottomLeft = this.workspacePositionToViewPosition(widgetWorkspacePositionBottomLeft);
			var widgetViewSize = { x: widgetSize.x * zoom, y: widgetSize.y * zoom };
			var widgetViewAABB =
			{
				lowerBound: widgetViewPositionBottomLeft,
				upperBound: { x: widgetViewPositionBottomLeft.x + widgetViewSize.x, y: widgetViewPositionBottomLeft.y + widgetViewSize.y }
			};

			// Skip components outside of view
			if(!circuit_utils.overlapAABB(widgetViewAABB ,viewAABB))
			{
				continue;
			}

			// Check if under cursor
			if(this.componentUnderCursor == null)
			{
				if(circuit_utils.pointInsideAABB(this.cursorPositionView, widgetViewAABB))
				{
					this.componentUnderCursor = component;
				}
			}

			// Calculate widget size
			var widgetWidthView = (widgetViewAABB.upperBound.x - widgetViewAABB.lowerBound.x);
			var widgetHeightView = (widgetViewAABB.upperBound.y - widgetViewAABB.lowerBound.y);

			// Draw widget image
			var widgetImage = imageDescriptor.loadedImage;
			ctx.drawImage(widgetImage, widgetViewAABB.lowerBound.x, widgetViewAABB.lowerBound.y, widgetWidthView, widgetHeightView);
		}

		// Change cursor?
		if(!this.isPanning)
		{
			var isComponentUnderCursor = (this.componentUnderCursor != null);
			this.canvas.style.cursor = isComponentUnderCursor? "pointer" : "default";
		}
	}

	// ---------------------------------------------------------------------------------------------------------------------

	renderGridSnapPoints()
	{
		// Grab workspace extents for current view
		var bottomLeftView = { x: 0, y: 0 }, topRightView = { x: this.canvas.width, y: this.canvas.height };
		var bottomLeftWorkspace = this.viewPositionToWorkspacePosition(bottomLeftView);
		var topRightWorkspace = this.viewPositionToWorkspacePosition(topRightView);

		// Setup constants
		var zoom = this.view.zoom;
		var snapPointSpacing = this.config.gridSnapSpacing;
		var snapPointRadius = circuit_utils.clamp(3.0 * zoom, 2.0, 6.0);
		var snapPointBorderThickness = 1.0, tau = (2 * Math.PI);

		// Calculate view co-ordinates for first (bottom left) snap point
		var firstSnapPointX = bottomLeftWorkspace.x - (bottomLeftWorkspace.x % snapPointSpacing);
		var firstSnapPointY = bottomLeftWorkspace.y - (bottomLeftWorkspace.y % snapPointSpacing);
		var firstSnapPointView = this.workspacePositionToViewPosition({ x: firstSnapPointX, y: firstSnapPointY });

		// Calculate required snap point repeats
		var snapPointSpacingView = this.config.gridSnapSpacing * zoom;
		var snapPointRepeatsX = Math.floor((topRightView.x - firstSnapPointView.x) / snapPointSpacingView);
		var snapPointRepeatsY = Math.floor((topRightView.y - firstSnapPointView.y) / snapPointSpacingView);

		// Setup render state
		var ctx = this.ctx;
		ctx.fillStyle = "#e9e9e9"; ctx.strokeStyle = "#808080";
		ctx.lineWidth = snapPointBorderThickness;

		// Render visible snap points
		for(var i = 0; i <= snapPointRepeatsX; ++i)
		{
			for(var j = 0; j <= snapPointRepeatsY; ++j)
			{
				var snapPointPositionView = { x: firstSnapPointView.x + (i * snapPointSpacingView), y: firstSnapPointView.y + (j * snapPointSpacingView) };
				ctx.beginPath();
				ctx.arc(snapPointPositionView.x, snapPointPositionView.y, snapPointRadius, 0, tau, false);
				ctx.fill();
				ctx.stroke();
			}
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
		this.cursorPositionView = { x: e.pageX, y: e.pageY };
		this.cursorPositionWorkspace = this.viewPositionToWorkspacePosition(this.cursorPositionView);
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
		this.view.focus.x += delta.x * (1 / this.view.zoom );
		this.view.focus.y += delta.y * (1 / this.view.zoom );

		// Update pan origin
		this.panOrigin.x = x;
		this.panOrigin.y = y;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	stopPanning(x, y)
	{
		this.isPanning = false;
		this.canvas.style.cursor = "default";
	}

	// ---------------------------------------------------------------------------------------------------------------------

	modifyZoom(zoomAmount)
	{
		var newTargetZoom = this.view.targetZoom * (1 + zoomAmount);
		this.view.targetZoom = circuit_utils.clamp(newTargetZoom, this.config.minZoom, this.config.maxZoom);
	}

	// ---------------------------------------------------------------------------------------------------------------------

	viewPositionToWorkspacePosition(viewPosition)
	{
		var focus = this.view.focus, zoom = this.view.zoom;
		var canvasCentre = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
		var workspacePostion = { x: viewPosition.x - canvasCentre.x, y: viewPosition.y - canvasCentre.y };
		workspacePostion.x /= zoom; workspacePostion.y /= zoom;       // Remove zoom
		workspacePostion.x -= focus.x; workspacePostion.y -= focus.y; // Remove pan
		return { x: workspacePostion.x, y: workspacePostion.y };
	}

	// ---------------------------------------------------------------------------------------------------------------------

	workspacePositionToViewPosition(workspacePosition)
	{
		var focus = this.view.focus, zoom = this.view.zoom;
		var canvasCentre = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
		var viewPosition = { x: workspacePosition.x, y: workspacePosition.y }
		viewPosition.x += focus.x; viewPosition.y += focus.y; // Apply pan
		viewPosition.x *= zoom; viewPosition.y *= zoom;       // Apply zoom
		return { x: viewPosition.x + canvasCentre.x, y: viewPosition.y + canvasCentre.y };
	}

	// ---------------------------------------------------------------------------------------------------------------------

	getComponentUnderCursor()
	{
		return this.componentUnderCursor;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	getGridSnapSpacing()
	{
		return this.config.gridSnapSpacing;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	setGridVisible(visible)
	{
		this.config.gridVisible = visible;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	setGridSnapSpacing(spacing)
	{
		this.config.gridSnapSpacing = spacing;
	}

	setGridSnap

	// ---------------------------------------------------------------------------------------------------------------------
}

// -------------------------------------------------------------------------------------------------------------------------