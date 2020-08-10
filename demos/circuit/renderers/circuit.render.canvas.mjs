
// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "../js/circuit.mjs";
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
// Constants
var tau = (2 * Math.PI);

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
		this.cursorInfo = { positionView: { x: -1, y: -1 }, component: null, inputPinIndex: -1, outputPinIndex: -1 };
		this.temporaryConnection = null;

		// Init frame time tracking
		this.frameTimeEntriesInitialised = false;
		this.frameTimeEntryCount = 60; this.frameTimeEntryIndex = 0;
		this.frameTimeEntries = Array(this.frameTimeEntryCount);

		// Init config
		this.config =
		{
			minZoom: 0.2,
			maxZoom: 25.0,
			zoomSpeed: 0.15,
			gridVisible: true,
			gridSnapSpacing: 100,
			gridSnapRadius: 20,
			pinRadius: 3,
			pinHoverMultiplier: 1.5,
			pinLineWidth: 2,
			connectionLineWidth: 4
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

	onUpdate(deltaS)
	{
		// Track frame time over multiple frames
		if(!this.frameTimeEntriesInitialised && deltaS > 0.0)
		{
			this.frameTimeEntries.fill(deltaS);
			this.frameTimeEntriesInitialised = true;
		}
		this.frameTimeEntries[this.frameTimeEntryIndex] = deltaS;
		this.frameTimeEntryIndex = (this.frameTimeEntryIndex + 1) % this.frameTimeEntryCount;

		// Resize canvas to match container
		this.updateCanvasSize();
		
		// Update smooth zoom
		var currentZoom = this.view.zoom, targetZoom = this.view.targetZoom, zoomSpeed = this.config.zoomSpeed;
		this.view.zoom = (targetZoom * zoomSpeed) + (currentZoom * (1.0 - zoomSpeed));
	}

	// ---------------------------------------------------------------------------------------------------------------------

	onRender(deltaS)
	{
		// Clear canvas
		var ctx = this.ctx;
		var viewAABB = { lowerBound: { x: 0, y: 0 }, upperBound: { x: this.canvas.width, y: this.canvas.height } };
		ctx.clearRect(viewAABB.lowerBound.x, viewAABB.lowerBound.y, viewAABB.upperBound.x, viewAABB.upperBound.y);

		// Clear cursor info
		this.cursorInfo.component = null;
		this.cursorInfo.inputPinIndex = -1;
		this.cursorInfo.outputPinIndex = -1;

		// Render grid snap points?
		if(this.config.gridVisible)
		{
			this.renderGridSnapPoints();
		}

		// Render components
		var zoom = this.view.zoom;
		var components = this.workspace.components;
		var pinRadiusView = this.config.pinRadius * zoom, pinHoverRadiusView = pinRadiusView * this.config.pinHoverMultiplier;
		var pinRenderPositions = [], pinHighlightIndices = [], renderedComponentCount = 0, totalPinCount = 0;
		for(var componentIndex = 0; componentIndex < components.length; ++componentIndex)
		{
			// Skip components without a position
			var component = components[componentIndex];
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

			// Get details
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

			// Update pin counts
			totalPinCount += (component.inputs.length + component.outputs.length);

			// Gather input pins
			var mouseoverAABB = widgetViewAABB;
			for(var inputPinIndex = 0; inputPinIndex < component.inputs.length; ++inputPinIndex)
			{
				var pinPositionLocal = widget.getInputPinPosition(inputPinIndex);
				var pinPositionView = { x: widgetViewAABB.lowerBound.x + (pinPositionLocal.x * zoom), y: widgetViewAABB.lowerBound.y + (pinPositionLocal.y * zoom) };
				var pinAABBView = this.getPinAABB(pinPositionView, pinRadiusView);

				// Skip pins outside of view
				if(!circuit_utils.overlapAABB(pinAABBView, viewAABB))
				{
					continue;
				}

				// Store pin for rendering
				pinRenderPositions.push(pinPositionView);

				// Check for mouse-over input pin?
				var pinUnderCursor = false;
				if((this.cursorInfo.component == null) && (this.cursorInfo.inputPinIndex == -1))
				{
					var pinHoverAABBView = this.getPinAABB(pinPositionView, pinHoverRadiusView);
					if(circuit_utils.pointInsideAABB(this.cursorInfo.positionView, pinHoverAABBView))
					{
						this.cursorInfo.component = component;
						this.cursorInfo.inputPinIndex = inputPinIndex;
						pinUnderCursor = true;
					}
				}

				// Highlight this pin?
				var pinInfo = { component: component, type: circuit.PinType.INPUT, index: inputPinIndex };
				if(pinUnderCursor || this.isTemporaryConnectionSource(pinInfo))
				{
					pinHighlightIndices.push(pinRenderPositions.length - 1);
				}
			}

			// Gather output pins
			for(var outputPinIndex = 0; outputPinIndex < component.outputs.length; ++outputPinIndex)
			{
				var pinPositionLocal = widget.getOutputPinPosition(outputPinIndex);
				var pinPositionView = { x: widgetViewAABB.lowerBound.x + (pinPositionLocal.x * zoom), y: widgetViewAABB.lowerBound.y + (pinPositionLocal.y * zoom) };
				var pinAABBView = this.getPinAABB(pinPositionView, pinRadiusView);

				// Skip pins outside of view
				if(!circuit_utils.overlapAABB(pinAABBView, viewAABB))
				{
					continue;
				}

				// Store pin for rendering
				pinRenderPositions.push(pinPositionView);

				// Check for mouse-over input pin?
				var pinUnderCursor = false;
				if((this.cursorInfo.component == null) && (this.cursorInfo.outputPinIndex == -1))
				{
					var pinHoverAABBView = this.getPinAABB(pinPositionView, pinHoverRadiusView);
					if(circuit_utils.pointInsideAABB(this.cursorInfo.positionView, pinHoverAABBView))
					{
						this.cursorInfo.component = component;
						this.cursorInfo.outputPinIndex = outputPinIndex;
						pinUnderCursor = true;
					}
				}

				// Highlight this pin?
				var pinInfo = { component: component, type: circuit.PinType.OUTPUT, index: outputPinIndex };
				if(pinUnderCursor || this.isTemporaryConnectionSource(pinInfo))
				{
					pinHighlightIndices.push(pinRenderPositions.length - 1);
				}
			}

			// Skip components outside of view
			if(!circuit_utils.overlapAABB(widgetViewAABB, viewAABB))
			{
				continue;
			}

			// Calculate widget size
			var widgetWidthView = (widgetViewAABB.upperBound.x - widgetViewAABB.lowerBound.x);
			var widgetHeightView = (widgetViewAABB.upperBound.y - widgetViewAABB.lowerBound.y);

			// Draw widget image
			var widgetImage = imageDescriptor.loadedImage;
			ctx.drawImage(widgetImage, widgetViewAABB.lowerBound.x, widgetViewAABB.lowerBound.y, widgetWidthView, widgetHeightView);
			++renderedComponentCount;

			// Check if component is under cursor
			if(this.cursorInfo.component == null)
			{
				if(circuit_utils.pointInsideAABB(this.cursorInfo.positionView, mouseoverAABB))
				{
					this.cursorInfo.component = component;
				}
			}
		}

		// Draw pins
		ctx.strokeStyle = "#493333"; ctx.fillStyle = "#e9e9e9"; ctx.lineWidth = this.config.pinLineWidth;
		for(var inputPinIndex = 0; inputPinIndex < pinRenderPositions.length; ++inputPinIndex)
		{
			var pinPositionView = pinRenderPositions[inputPinIndex];
			ctx.beginPath();
			ctx.arc(pinPositionView.x, pinPositionView.y, pinRadiusView, 0.0, tau);
			ctx.fill(); ctx.stroke();
		}

		// Draw highlighted pins?
		ctx.strokeStyle = "#333333"; ctx.fillStyle = "#00FF00"; ctx.lineWidth = this.config.pinLineWidth;
		for(var highlightedPinEntry = 0; highlightedPinEntry < pinHighlightIndices.length; ++ highlightedPinEntry)
		{
			var highlightedPinIndex = pinHighlightIndices[highlightedPinEntry];
			var pinPositionView = pinRenderPositions[highlightedPinIndex];
			ctx.beginPath();
			ctx.arc(pinPositionView.x, pinPositionView.y, pinRadiusView, 0.0, tau);
			ctx.fill(); ctx.stroke();
		}

		// Render connections
		var connections = this.workspace.getConnections();
		ctx.strokeStyle = "#333333"; ctx.lineWidth = this.config.connectionLineWidth * zoom; ctx.lineCap = "round";
		for(var connectionIndex = 0; connectionIndex < connections.length; ++connectionIndex)
		{
			var connectionInfo = connections[connectionIndex];
			var connectionStartPosition = this.getPinPosition(connectionInfo.sourcePinInfo);
			var connectionStartPositionView = this.workspacePositionToViewPosition(connectionStartPosition);
			var connectionEndPosition = this.getPinPosition(connectionInfo.targetPinInfo);
			var connectionEndPositionView = this.workspacePositionToViewPosition(connectionEndPosition);
			ctx.beginPath();
			ctx.moveTo(connectionStartPositionView.x, connectionStartPositionView.y);
			ctx.lineTo(connectionEndPositionView.x, connectionEndPositionView.y);
			ctx.stroke();
		}

		// Draw temporary connection?
		if(this.temporaryConnection != null)
		{
			var connectionStartPosition = this.getPinPosition(this.temporaryConnection.sourcePinInfo);
			var connectionStartPositionView = this.workspacePositionToViewPosition(connectionStartPosition);
			var connectionEndPosition = this.getTemporaryConnectionEndPosition();
			var connectionEndPositionView = this.workspacePositionToViewPosition(connectionEndPosition);
			ctx.strokeStyle = "#333333"; ctx.lineWidth = this.config.connectionLineWidth * zoom; ctx.lineCap = "round";
			ctx.beginPath();
			ctx.moveTo(connectionStartPositionView.x, connectionStartPositionView.y);
			ctx.lineTo(connectionEndPositionView.x, connectionEndPositionView.y);
			ctx.stroke();
		}

		// Draw render stats?
		if(this.config.showRenderStats)
		{
			// Calculate average fps
			var averageFrameTimeS = 0.0;
			for(var frameIndex = 0; frameIndex < this.frameTimeEntryCount; ++frameIndex)
			{
				averageFrameTimeS += this.frameTimeEntries[frameIndex];
			}
			averageFrameTimeS /= this.frameTimeEntryCount;
			var averageFps = Math.round(1.0 / averageFrameTimeS);

			// Render state
			var stats = `Rendered components: (${renderedComponentCount}/${components.length})`;
			stats += ` | Rendered pins: (${pinRenderPositions.length}/${totalPinCount})`;
			stats += ` | Zoom = ${zoom.toFixed(2)}`;
			stats += ` | Frame time = ${(averageFrameTimeS * 1000).toFixed(2)}ms (${averageFps} fps)`;
			ctx.font = "14px Arial"; ctx.fillStyle = "#333333";
			ctx.fillText(stats, 10, this.canvas.height - 11);
		}
	}

	// ---------------------------------------------------------------------------------------------------------------------

	renderGridSnapPoints()
	{
		// Grab workspace extents for current view
		var bottomLeftView = { x: 0, y: 0 }, topRightView = { x: this.canvas.width, y: this.canvas.height };
		var bottomLeftWorkspace = this.viewPositionToWorkspacePosition(bottomLeftView);

		// Setup constants
		var zoom = this.view.zoom;
		var snapPointSpacing = this.config.gridSnapSpacing;
		var snapPointRadius = circuit_utils.clamp(3.0 * zoom, 2.0, 6.0);
		var snapPointBorderThickness = 1.0;

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

	getPinAABB(pinPositionView, pinRadius)
	{
		var lower = { x: pinPositionView.x - pinRadius, y: pinPositionView.y - pinRadius };
		var upper = { x: pinPositionView.x + pinRadius, y: pinPositionView.y + pinRadius };
		return { lowerBound: lower, upperBound: upper };
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
		this.cursorInfo.positionView = { x: e.pageX, y: e.pageY };
		this.cursorInfo.positionWorkspace = this.viewPositionToWorkspacePosition(this.cursorInfo.positionView);
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

	renderTemporaryConnection(sourcePinInfo, end)
	{
		this.temporaryConnection = { sourcePinInfo: sourcePinInfo, end: end };
	}

	// ---------------------------------------------------------------------------------------------------------------------

	isTemporaryConnectionSource(pinInfo)
	{
		// Ignore if no temporary connection is active
		if(this.temporaryConnection == null)
		{
			return false;
		}

		// Check if the pin provided is the temporary connection source
		var connectionSourcePinInfo = this.temporaryConnection.sourcePinInfo;
		var startComponent =  connectionSourcePinInfo.component;
		return (pinInfo.component == startComponent) && (pinInfo.type == connectionSourcePinInfo.type) && (pinInfo.index == connectionSourcePinInfo.index);
	}

	// ---------------------------------------------------------------------------------------------------------------------

	getTemporaryConnectionEndPosition()
	{
		// Ignore if no temporary connection is active
		if(this.temporaryConnection == null)
		{
			return { x: 0, y: 0 };
		}

		// Check to see if any pins are under cursor
		var inputPinUnderCursor = (this.cursorInfo.inputPinIndex >= 0);
		var outputPinUnderCursor = (this.cursorInfo.outputPinIndex >= 0);
		if(inputPinUnderCursor || outputPinUnderCursor)
		{
			// Snap to pin under cursor
			var component = this.cursorInfo.component;
			var pinType = inputPinUnderCursor? circuit.PinType.INPUT : circuit.PinType.OUTPUT;
			var pinIndex = inputPinUnderCursor? this.cursorInfo.inputPinIndex : this.cursorInfo.outputPinIndex;
			var pinInfo = { component: component, type: pinType, index: pinIndex };
			return this.getPinPosition(pinInfo);
		}
		else
		{
			// Use end position provided
			return this.temporaryConnection.end;
		}
	}

	// ---------------------------------------------------------------------------------------------------------------------

	clearTemporaryConnection()
	{
		this.temporaryConnection = null;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	userIsInteracting()
	{
		return this.isPanning;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	getCursorInfo()
	{
		return this.cursorInfo;
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

	// ---------------------------------------------------------------------------------------------------------------------

	setShowRenderStats(show)
	{
		this.config.showRenderStats = show;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	getPinPosition(pinInfo)
	{
		var component = pinInfo.component;
		var widget = component.descriptor.widget;
		var renderImage = widget.getRenderImage(component);
		var widgetSize = { x: renderImage.width, y: renderImage.height };
		var componentPosition = component.args.position;
		var isInputPin = (pinInfo.type == circuit.PinType.INPUT);
		var pinPositionLocal = isInputPin? widget.getInputPinPosition(pinInfo.index) : widget.getOutputPinPosition(pinInfo.index);
		var componentBottomLeft = { x: componentPosition.x - (widgetSize.x * 0.5), y: componentPosition.y - (widgetSize.y * 0.5) };
		return { x: componentBottomLeft.x + pinPositionLocal.x, y: componentBottomLeft.y + pinPositionLocal.y };
	}

	// ---------------------------------------------------------------------------------------------------------------------
}

// -------------------------------------------------------------------------------------------------------------------------