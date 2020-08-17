// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "./js/circuit.mjs";
import * as circuit_render from "./js/circuit.render.mjs";
import * as circuit_utils from "./js/circuit.utils.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Import canvas renderer
// NOTE: The editor doesn't interface with this directly, but we need to ensure it gets loaded (and registered)
import * as circuit_canvas from "./renderers/circuit.render.canvas.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// External dependencies
const jqueryLib = "third-party/jquery/jquery.js";           // jQuery
const jqueryUILib = "third-party/jquery/jquery-ui.min.js";  // jQuery UI (js)
const jqueryCss = "third-party/jquery/jquery-ui.min.css";   // jQuery UI (css)
const editorCss = "circuit.editor.css";                     // Editor css

// -------------------------------------------------------------------------------------------------------------------------
// Misc
var circuitRoot = "./";

// -------------------------------------------------------------------------------------------------------------------------
// Config
var config = 
{
	updateFrequency: 5,
	gridSnapSpacing: 130,
	messagePanel: { width: 540, height:46, padding: 30, timeout: 5000 }
};

// -------------------------------------------------------------------------------------------------------------------------
// Components
var componentPicker = null, settingsPanel = null, messagePanel = null;

// -------------------------------------------------------------------------------------------------------------------------
// Data
var workspace = null;
var workspaceCanvas = null;
var workspaceRenderer = null;

// -------------------------------------------------------------------------------------------------------------------------
// UI
var canvasContainer = null;
var draggingComponentPickerItem = null;
var draggingComponentPickerItemIcon = null;
var draggingComponent = null;
var draggingComponentOriginalPosition = { };
var draggingComponentMoved = false;
var draggingConnection = null;
var messagePanelTimer = null;

// -------------------------------------------------------------------------------------------------------------------------
// Keys
var KEY_R = 82;

// -------------------------------------------------------------------------------------------------------------------------
// Init
window.onload = function()
{
	init();
};

// -------------------------------------------------------------------------------------------------------------------------

async function init()
{
	// Load editor dependencies
	if(!await loadDependencies())
	{
		console.error("Editor: Failed to load dependencies");
		return false;
	}

	// Init ciruit
	await circuit.init();

	// Setup component picker
	initComponentPicker();

	// Setup toolbar
	initSettingsPanel();

	// Setup message panel
	initMessagePanel();

	// Grab canvas container
	canvasContainer = $("#editor_canvas_container");

	// Make canvas container full-screen
	resizeCanvasContainer();

	// Make sure canvas container resizes with screen
	$(window).resize(() => resizeCanvasContainer());

	// Create workspace for editor
	workspace = circuit.createWorkspace("editor", canvasContainer);
	if(workspace == null)
	{
		console.error("Editor: Workspace creation failed");
		return false;
	}

	// Grab renderer
	workspaceRenderer = circuit_render.getRenderer(workspace);
	if(workspaceRenderer == null)
	{
		console.error("Editor: Failed to find renderer for workspace");
		return false;
	}

	// Grab canvas
	workspaceCanvas = $("#editor_canvas_container canvas");

	// Setup renderer defaults
	workspaceRenderer.setGridSnapSpacing(config.gridSnapSpacing);
	workspaceRenderer.setGridVisible(getEditorSettingValue(EditorSettings.GRID_MODE) == EditorSettings.GRID_MODE_SHOW);
	workspaceRenderer.setShowRenderStats(getEditorSettingValue(EditorSettings.RENDER_STATS) == EditorSettings.RENDER_STATS_ENABLED);

	// Bind mouse events
	$(window).on("mouseup", (e) => onWindowMouseUp(e));
	workspaceCanvas.on("mouseup", (e) => onCanvasMouseUp(e));
	workspaceCanvas.on("mousedown", (e) => onCanvasMouseDown(e));
	$(document).on("mousemove", (e) => onMouseMove(e));
	$(document).keydown((e) => onKeyDown(e));

	// Kick-off update
	setTimeout(updateWorkspace, (1.0 / config.updateFrequency) * 1000);
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

function updateWorkspace()
{
	// Update workspace
	workspace.update();

	// Schedule next update
	setTimeout(updateWorkspace, (1.0 / config.updateFrequency) * 1000);
}

// -------------------------------------------------------------------------------------------------------------------------

function resizeCanvasContainer()
{
	canvasContainer.css("width", window.innerWidth);
	canvasContainer.css("height", window.innerHeight);
}

// -------------------------------------------------------------------------------------------------------------------------

function initComponentPicker()
{
	// Setup component picker dialog
	var componentPickerWidth = 300, componentPickerPadding = 30;
	componentPicker = $("#editor_component_picker");
	componentPicker.dialog({ width: componentPickerWidth, closeOnEscape: false, dialogClass: "noclose" });

	// Bind events
	componentPicker.mouseup((e) => { e.preventDefault(); });

	// Set component picker initial position
	$("div[aria-describedby='editor_component_picker']").offset({ top: componentPickerPadding, left: componentPickerPadding });

	// Grab component descriptors and sort by category
	var componentRegistry = circuit.getComponentRegistry();
	var componentDescriptors = Object.values(componentRegistry);
	componentDescriptors.sort((a, b) => (a.category > b.category) ? 1 : ((b.category > a.category) ? -1 : 0));

	// Populate components picker with components
	var currentCategory = "", firstCategory = true;
	for (var i = 0; i < componentDescriptors.length; ++i)
	{
		var componentDescriptor = componentDescriptors[i];

		// Ignore components without a widget
		var widget = componentDescriptor.widget;
		if(widget == null)
		{
			continue;
		}

		// Create category header?
		var widgetDescriptor = widget.descriptor;
		var category = widgetDescriptor.category;
		if(firstCategory || category != currentCategory)
		{
			if(!firstCategory)
			{
				componentPicker.append(`<br/>`);
			}
			componentPicker.append(`<h2>${category}</h2>`);
		}
		firstCategory = false;
		currentCategory = category;

		// Create item html
		var componentName = componentDescriptor.name;
		var componentDisplayName = widgetDescriptor.displayName, componentDescription = widgetDescriptor.description;
		var componentIcon = `${circuitRoot}/components/${componentName}/img/${widgetDescriptor.icon.file}`;
		var componmentPickerItemHtml = "";
		componmentPickerItemHtml += `<div class='editor_component_picker_item'>`;
		componmentPickerItemHtml += `  <div class='icon' style="background-image: url('${componentIcon}')"/>`;
		componmentPickerItemHtml += `  <div class='content'>`;
		componmentPickerItemHtml += `    <h2>${componentDisplayName}</h2>`;
		componmentPickerItemHtml += `    <div class="description">${componentDescription}</div>`;
		componmentPickerItemHtml += `  </div>`;
		componmentPickerItemHtml += `</div>`;
		var componentPickerItem = $(componmentPickerItemHtml);

		// Store component descriptor and icon shortcut in item data
		componentPickerItem.data({ componentDescriptor: componentDescriptor, icon: componentIcon });

		// Register item mouse event
		componentPickerItem.on("mousedown", { item: componentPickerItem }, (e) => onStartDraggingComponentPickerItem(e.data.item, e.pageX, e.pageY));

		// Add item to picker
		componentPicker.append(componentPickerItem);
	}

	// Setup icon to show when dragging component picker items
	draggingComponentPickerItemIcon = $("<div id='editor_component_picker_item_drag_icon'></div>");
	$("body").append(draggingComponentPickerItemIcon);
	return;
}

// -------------------------------------------------------------------------------------------------------------------------

function initMessagePanel()
{
	var messagePanelShowEffect = { effect: "slideDown", duration: 100 }, messagePanelHideEffect = { effect: "slideUp", duration: 100 };
	messagePanel = $("#editor_message_panel");
	messagePanel.dialog({ width: config.messagePanel.width, height: config.messagePanel.height, closeOnEscape: true, autoOpen: false, show: messagePanelShowEffect, hide: messagePanelHideEffect });
	messagePanel.dialog("option", "dialogClass", "errorDialog");
	$("div[aria-describedby='editor_message_panel']").offset({ top: config.messagePanel.padding });
}

// -------------------------------------------------------------------------------------------------------------------------

function showError(message)
{
	// Show message panel
	var content = `<b>ERROR</b>: ${message}`;
	messagePanel.html(content);
	messagePanel.dialog("open");

	// Ensure messasge window is centred
	var windowWidth = $(window).width();
	var positionTop = config.messagePanel.padding;
	var positionLeft = (windowWidth * 0.5) - (config.messagePanel.width * 0.5);
	$("div[aria-describedby='editor_message_panel']").offset({ top: positionTop, left: positionLeft });

	// Clear existing timer?
	if(messagePanelTimer != null)
	{
		clearTimeout(messagePanelTimer);
	}

	// Set timer
	messagePanelTimer = setTimeout(() => { messagePanel.dialog("close") }, config.messagePanel.timeout);
}

// -------------------------------------------------------------------------------------------------------------------------

function onMouseMove(e)
{
	// Update dragged component picker item?
	if(draggingComponentPickerItem != null)
	{
		updateDraggingComponentPickerItemIconPosition(e.pageX, e.pageY);
	}

	// Update dragged component?
	if(draggingComponent != null)
	{
		updateDraggingComponent(e.pageX, e.pageY);
	}

	// Update dragged connection?
	if(draggingConnection != null)
	{
		updateDraggingConnection(e.pageX, e.pageY);
	}

	// Update cursor
	// NOTE: Avoid modifying cursor if user is already interacting with renderer (zoom/pan etc)
	if(!workspaceRenderer.userIsInteracting())
	{
		var cursorInfo = workspaceRenderer.getCursorInfo();
		var isComponentUnderCursor = (cursorInfo.component != null);
		var isPinUnderCursor = ((cursorInfo.inputPinIndex >= 0) || (cursorInfo.outputPinIndex >= 0));
		setCursor(isPinUnderCursor? "crosshair" : (isComponentUnderCursor? "grab" : "default"));
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function onKeyDown(e)
{
	// Grab cursor info
	var cursorInfo = workspaceRenderer.getCursorInfo();

	// Handle key press
	switch(e.which)
	{
		case KEY_R:
		{
			if(cursorInfo.component)
			{
				RotateComponent(cursorInfo.component);
			}
			break;
		}
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function onStartDragging()
{
	// Toggle grid visibility?
	if(getEditorSettingValue(EditorSettings.GRID_MODE) == EditorSettings.GRID_MODE_SHOW_WHILST_DRAGGING)
	{
		workspaceRenderer.setGridVisible(true);
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function onStopDragging()
{
	// Toggle grid visibility?
	if(getEditorSettingValue(EditorSettings.GRID_MODE) == EditorSettings.GRID_MODE_SHOW_WHILST_DRAGGING)
	{
		workspaceRenderer.setGridVisible(false);
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function isDragging()
{
	return (draggingComponentPickerItem != null) || (draggingComponent != null);
}

// -------------------------------------------------------------------------------------------------------------------------

function onStartDraggingComponentPickerItem(componentPickerItem, x, y)
{
	onStartDragging();

	// Set dragged component picker item
	var componentName = componentPickerItem.data().componentDescriptor.name;
	draggingComponentPickerItem = componentPickerItem;

	// Show and move icon
	draggingComponentPickerItemIcon.css('background-image', `url('${componentPickerItem.data().icon}')`);
	draggingComponentPickerItemIcon.show();
	updateDraggingComponentPickerItemIconPosition(x, y);
}

// -------------------------------------------------------------------------------------------------------------------------

function onCancelDraggingComponentPickerItem()
{
	onStopDragging();

	// Clear dragged component picker item
	var componentName = draggingComponentPickerItem.data().componentDescriptor.name;
	draggingComponentPickerItem = null;

	// Hide icon
	draggingComponentPickerItemIcon.hide();
}

// -------------------------------------------------------------------------------------------------------------------------

function onFinishDraggingComponentPickerItem(x, y)
{
	onStopDragging();

	// Extract descriptor and clear dragged component picker item
	var componentDescriptor = draggingComponentPickerItem.data().componentDescriptor;
	draggingComponentPickerItem = null;

	// Hide icon
	draggingComponentPickerItemIcon.hide("puff", { percent: 150 }, 300);

	// Get cursor view position
	var cursorPositionView = cursorPositionToViewPosition(x, y);

	// Perform view --> workspace position mapping
	var workspacePosition = workspaceRenderer.viewPositionToWorkspacePosition(cursorPositionView);

	// Add component to workspace
	workspace.addComponent(componentDescriptor, { position: workspacePosition });
}

// -------------------------------------------------------------------------------------------------------------------------

function updateDraggingComponentPickerItemIconPosition(x, y)
{
	// Get cursor view position
	var cursorPositionView = cursorPositionToViewPosition(x, y);

	// Move dragged icon
	var iconWidth = draggingComponentPickerItemIcon.width();
	var iconHeight = draggingComponentPickerItemIcon.height();
	draggingComponentPickerItemIcon.css("left", cursorPositionView.x  - (iconWidth * 0.5));
	draggingComponentPickerItemIcon.css("top", cursorPositionView.y - (iconHeight * 0.5));
}

// -------------------------------------------------------------------------------------------------------------------------

function onStartDraggingComponent(component, x, y)
{
	onStartDragging();

	// Store dragged component
	draggingComponentOriginalPosition = workspace.getComponentPosition(component);
	draggingComponent = component;
	draggingComponentMoved = false
}

// -------------------------------------------------------------------------------------------------------------------------

function updateDraggingComponent(x, y)
{
	// Move dragged component
	draggingComponentMoved = true;
	var cursorPostionWorkspace = cursorPositionToWorkspacePosition(x, y);
	workspace.setComponentPosition(draggingComponent, cursorPostionWorkspace);
}

// -------------------------------------------------------------------------------------------------------------------------

function onCancelDraggingComponent(x, y)
{
	onStopDragging();

	// Put component back where it was before we started moving it
	workspace.setComponentPosition(draggingComponent, draggingComponentOriginalPosition);

	// Clear dragged component
	draggingComponent = null;
	draggingComponentMoved = false;
}

// -------------------------------------------------------------------------------------------------------------------------

function onFinishDraggingComponent(x, y)
{
	onStopDragging();

	// Raise component click event?
	if(!draggingComponentMoved)
	{
		var widget = draggingComponent.descriptor.widget;
		if(widget != null && (typeof widget["onClick"] === 'function'))
		{
			widget.onClick(draggingComponent);
		}
	}

	// Clear dragged component
	draggingComponent = null;
	draggingComponentMoved = false;
}

// -------------------------------------------------------------------------------------------------------------------------

function onStartDraggingConnection(sourcePinInfo, x, y)
{
	onStartDragging();

	// Store connection
	draggingConnection = { sourcePinInfo: sourcePinInfo };

	// Start rendering temporary connection
	updateDraggingConnection(x, y);
}

// -------------------------------------------------------------------------------------------------------------------------

function updateDraggingConnection(x, y)
{
	// Move connection
	var end = workspaceRenderer.viewPositionToWorkspacePosition({ x: x, y: y });
	workspaceRenderer.renderTemporaryConnection(draggingConnection.sourcePinInfo, end);
}

// -------------------------------------------------------------------------------------------------------------------------

function onCancelDraggingConnection()
{
	onStopDragging();

	// Clear dragged connection
	draggingConnection = null;
	workspaceRenderer.clearTemporaryConnection();
}

// -------------------------------------------------------------------------------------------------------------------------

function onFinishDraggingConnection()
{
	onStopDragging();

	// Check to see if the cursor was released over a pin
	var cursorInfo = workspaceRenderer.getCursorInfo();
	var haveInputPin = (cursorInfo.inputPinIndex >= 0), haveOutputPin = (cursorInfo.outputPinIndex >= 0);
	if(haveInputPin || haveOutputPin)
	{
		// Build connection info
		var targetPinType = haveInputPin? circuit.PinType.INPUT : circuit.PinType.OUTPUT;
		var targetPinIndex = haveInputPin? cursorInfo.inputPinIndex : cursorInfo.outputPinIndex;
		var connectionInfo =
		{
			sourcePinInfo: draggingConnection.sourcePinInfo,
			targetPinInfo: { component: cursorInfo.component, type: targetPinType, index: targetPinIndex }
		};

		// Attempt connection
		var result = workspace.addConnection(connectionInfo);
		if(!result.value)
		{
			showError(`Connection failed: ${result.message}`);
		}
	}

	// Clear dragged connection
	draggingConnection = null;
	workspaceRenderer.clearTemporaryConnection();
}

// -------------------------------------------------------------------------------------------------------------------------

function cursorPositionToWorkspacePosition(x, y)
{
	var cursorPostionView = cursorPositionToViewPosition(x, y);
	return workspaceRenderer.viewPositionToWorkspacePosition(cursorPostionView);
}

// -------------------------------------------------------------------------------------------------------------------------

function cursorPositionToViewPosition(x, y)
{
	var cursorPostionView = { x: x, y: y };
	if(getEditorSettingValue(EditorSettings.GRID_SNAP) == EditorSettings.GRID_SNAP_ENABLED)
	{	
		var cursorPositionWorkspace = workspaceRenderer.viewPositionToWorkspacePosition(cursorPostionView);
		var cursorPositionWorkspaceSnapped = snapPositionToGrid(cursorPositionWorkspace);
		var cursorPositionViewSnapped = workspaceRenderer.workspacePositionToViewPosition(cursorPositionWorkspaceSnapped);
		return cursorPositionViewSnapped;
	}
	else
	{
		return cursorPostionView;
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function setCursor(cursor)
{
	workspaceCanvas.css("cursor", cursor);
}

// -------------------------------------------------------------------------------------------------------------------------

function onWindowMouseUp()
{
	// Cancel dragged component picker item
	if(draggingComponentPickerItem != null)
	{
		onCancelDraggingComponentPickerItem();
	}

	// Cancel dragged component
	if(draggingComponent != null)
	{
		onCancelDraggingComponent();
	}

	// Cancel dragged connection
	if(draggingConnection != null)
	{
		onCancelDraggingConnection();
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function onCanvasMouseUp(e)
{
	// Finish dragging component picker item?
	if(draggingComponentPickerItem != null)
	{
		onFinishDraggingComponentPickerItem(e.pageX, e.pageY);
	}

	// Finish dragging component?
	if(draggingComponent != null)
	{
		onFinishDraggingComponent(e.pageX, e.pageY);
	}

	// Finish dragging connection?
	if(draggingConnection != null)
	{
		onFinishDraggingConnection(e.pageX, e.pageY);
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function onCanvasMouseDown(e)
{
	// Grab cursor info
	var cursorInfo = workspaceRenderer.getCursorInfo();
	var isComponentUnderCursor = (cursorInfo.component != null);
	var isInputPinUnderCursor = (cursorInfo.inputPinIndex >= 0), isOutputPinUnderCursor = (cursorInfo.outputPinIndex >= 0);
	var isPinUnderCursor = (isInputPinUnderCursor || isOutputPinUnderCursor);

	// Handle manipulation
	if(isComponentUnderCursor)
	{
		if(isPinUnderCursor)
		{
			// Grab pin info
			var pinType = isInputPinUnderCursor? circuit.PinType.INPUT : circuit.PinType.OUTPUT;
			var pinIndex = isInputPinUnderCursor? cursorInfo.inputPinIndex : cursorInfo.outputPinIndex;
			var pinInfo = { component: cursorInfo.component, type: pinType, index: pinIndex };

			if(e.ctrlKey)
			{
				// Attempt to destroy connection
				workspace.removeConnections(pinInfo);
			}
			else
			{
				// Start forming connection
				onStartDraggingConnection(pinInfo, e.pageX, e.pageY);
			}
		}
		else
		{
			// Start dragging component
			onStartDraggingComponent(cursorInfo.component, e.pageX, e.pageY);
		}
	}
}

// -------------------------------------------------------------------------------------------------------------------------
// Misc
function snapPositionToGrid(workspacePosition)
{
	var spacing = workspaceRenderer.getGridSnapSpacing();
	var gridX = Math.round(workspacePosition.x / spacing), gridY = Math.round(workspacePosition.y / spacing);
	return { x: (gridX * spacing), y: (gridY * spacing) };
}

// -------------------------------------------------------------------------------------------------------------------------

function RotateComponent(component)
{
	// Add rotation arg if not already present
	if(!component.args.hasOwnProperty("rotation"))
	{
		component.args.rotation = 0;
	}

	// Apply rotation
	component.args.rotation = (component.args.rotation + 1) % 4;
}

// -------------------------------------------------------------------------------------------------------------------------
// Settings panel
function initSettingsPanel()
{
	settingsPanel = $("#editor_settings");
	var settingsPanelWidth = 390, settingsPanelHeight = 318, settingsPanelPadding = 30;
	var windowWidth = $(window).width();
	settingsPanel.dialog({ width: settingsPanelWidth, height:settingsPanelHeight, closeOnEscape: false, dialogClass: "noclose" });

	// Position at top right
	$("div[aria-describedby='editor_settings']").offset({ top: settingsPanelPadding, left: windowWidth - settingsPanelWidth - settingsPanelPadding });

	// Setup radio elements
	$("#editor_settings input").checkboxradio({ icon: false });

	// Bind setting change events
	bindSettingChangedEvent(EditorSettings.GRID_MODE);
	bindSettingChangedEvent(EditorSettings.RENDER_STATS);
}

// -------------------------------------------------------------------------------------------------------------------------

function bindSettingChangedEvent(settingName)
{
	$(`#editor_settings input[name=${settingName}]`).change(function() { onSettingChanged(settingName, this.value) });
}

// -------------------------------------------------------------------------------------------------------------------------

function onSettingChanged(settingName, newValue)
{
	switch(settingName)
	{
		case EditorSettings.GRID_MODE:
		{
			switch(newValue)
			{
				case EditorSettings.GRID_MODE_SHOW: { workspaceRenderer.setGridVisible(true); break; }
				case EditorSettings.GRID_MODE_SHOW_WHILST_DRAGGING: { workspaceRenderer.setGridVisible(isDragging()); break; }
				case EditorSettings.GRID_MODE_HIDE: { workspaceRenderer.setGridVisible(false); break; }
			}
			break;
		}
		case EditorSettings.RENDER_STATS:
		{
			switch(newValue)
			{
				case EditorSettings.RENDER_STATS_ENABLED: { workspaceRenderer.setShowRenderStats(true); break; }
				case EditorSettings.RENDER_STATS_DISABLED: { workspaceRenderer.setShowRenderStats(false); break; }
			}
			break;
		}
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function getEditorSettingValue(settingName)
{
	return $(`#editor_settings input[name=${settingName}]:checked`).val();
}

// -------------------------------------------------------------------------------------------------------------------------
// Settings enum
// -------------------------------------------------------------------------------------------------------------------------
// NOTE: These should match the values in the html
const EditorSettings =
{
	// Grid mode
	GRID_MODE: "editor_settings_grid_mode",
	GRID_MODE_SHOW: "show",
	GRID_MODE_SHOW_WHILST_DRAGGING: "show_whilst_dragging",
	GRID_MODE_HIDE: "hide",

	// Grid snap
	GRID_SNAP: "editor_settings_gridsnap",
	GRID_SNAP_ENABLED: "enabled",
	GRID_SNAP_DISABLED: "disabled",

	// Render stats
	RENDER_STATS: "editor_settings_renderstats",
	RENDER_STATS_ENABLED: "enabled",
	RENDER_STATS_DISABLED: "disabled",
};

// -------------------------------------------------------------------------------------------------------------------------
// Dependencies
async function loadDependencies()
{
	// Load jquery dynamically (cannot currently be imported as ES module)
	if(!await circuit_utils.loadScript(jqueryLib))
	{
		console.error("Failed to load jQuery");
		return false;
	}

	// Load jqueryUI dynamically (cannot currently be imported as ES module)
	if(!await circuit_utils.loadScript(jqueryUILib))
	{
		console.error("Failed to load jQuery UI");
		return false;
	}

	// Load jQuery UI stylesheet
	$("head").append(`<link rel="stylesheet" type="text/css" href="${jqueryCss}">`);

	// Load editor stylesheet
	$("head").append(`<link rel="stylesheet" type="text/css" href="${editorCss}">`);

	// All dependencies loaded
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------