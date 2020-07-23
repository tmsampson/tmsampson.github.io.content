// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "./js/circuit.mjs";
import * as circuit_utils from "./js/circuit.utils.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Import canvas renderer
// NOTE: The editor doesn't interface with this directly, but we need to ensure it gets loaded (and registered)
import * as circuit_canvas from "./renderers/circuit.render.canvas.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// External dependencies
const jqueryLib = "third-party/jquery/jquery.js";			// jQuery
const jqueryUILib = "third-party/jquery/jquery-ui.min.js";	// jQuery UI (js)
const jqueryCss = "third-party/jquery/jquery-ui.min.css";	// jQuery UI (css)
const editorCss = "circuit.editor.css";						// Editor css

// -------------------------------------------------------------------------------------------------------------------------
// Config
var circuitRoot = "./";

// -------------------------------------------------------------------------------------------------------------------------
// Components
var componentPicker = null, toolbar = null;

// -------------------------------------------------------------------------------------------------------------------------
// Data
var workspace = null;

// -------------------------------------------------------------------------------------------------------------------------
// UI
var draggingComponentPickerItem = null;
var draggingComponentPickerItemIcon = null;

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
		console.error("Failed to load dependencies");
	}

	// Init ciruit
	await circuit.init();

	// Setup component picker
	initComponentPicker();

	// Setup toolbar
	initToolbar();

	// Create workspace for editor
	var canvasContainer = $("#editor_canvas_container");
	workspace = circuit.createWorkspace("editor", canvasContainer);

	// Bind mouse events
	$("#editor_canvas_container canvas").mouseup(() => onCanvasMouseUp());
	$(document).on('mousemove', (e) => onMouseMove(e));
}

// -------------------------------------------------------------------------------------------------------------------------

function initComponentPicker()
{
	// Setup component picker dialog
	var componentPickerWidth = 300, componentPickerPadding = 30;
	componentPicker = $("#editor_component_picker");
	componentPicker.dialog({ width: componentPickerWidth, closeOnEscape: false });

	// Bind events
	componentPicker.mouseup(() => onComponentPickerMouseUp());

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
		var componentIcon = `${circuitRoot}/components/${componentName}/img/${widgetDescriptor.imageIcon}`;
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

function onMouseMove(e)
{
	if(draggingComponentPickerItem != null)
	{
		updateDraggingComponentPickerItemIconPosition(e.pageX, e.pageY);
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function onStartDraggingComponentPickerItem(componentPickerItem, x, y)
{
	var componentName = componentPickerItem.data().componentDescriptor.name;
	console.log(`Started dragging component picker item: ${componentName}`);
	draggingComponentPickerItem = componentPickerItem;

	// Show and move icon
	draggingComponentPickerItemIcon.css('background-image', `url('${componentPickerItem.data().icon}')`);
	draggingComponentPickerItemIcon.show();
	updateDraggingComponentPickerItemIconPosition(x, y);
}

// -------------------------------------------------------------------------------------------------------------------------

function onCancelDraggingComponentPickerItem()
{
	var componentName = draggingComponentPickerItem.data().componentDescriptor.name;
	console.log(`Cancel dragging component picker item: ${componentName}`);
	draggingComponentPickerItem = null;

	// Hide icon
	draggingComponentPickerItemIcon.hide();
}

// -------------------------------------------------------------------------------------------------------------------------

function onFinishDraggingComponentPickerItem()
{
	var componentName = draggingComponentPickerItem.data().componentDescriptor.name;
	console.log(`Finish dragging component picker item: ${componentName}`);
	draggingComponentPickerItem = null;

	// Hide icon
	draggingComponentPickerItemIcon.hide();
}

// -------------------------------------------------------------------------------------------------------------------------

function updateDraggingComponentPickerItemIconPosition(x, y)
{
	draggingComponentPickerItemIcon.css("left", x  - 26);
	draggingComponentPickerItemIcon.css("top", y - 26);
}

// -------------------------------------------------------------------------------------------------------------------------

function onComponentPickerMouseUp()
{
	if(draggingComponentPickerItem != null)
	{
		onCancelDraggingComponentPickerItem();
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function onCanvasMouseUp()
{
	if(draggingComponentPickerItem != null)
	{
		onFinishDraggingComponentPickerItem();
	}
}

// -------------------------------------------------------------------------------------------------------------------------
// Toolbar
function initToolbar()
{
	toolbar = $("#editor_toolbar");
	var toolbarWidth = 600, toolbarPadding = 30;
	var windowWidth = $(window).width();
	toolbar.dialog({ width: toolbarWidth, height:50, closeOnEscape: false });
	$("div[aria-describedby='editor_toolbar']").offset({ top: toolbarPadding, left: windowWidth - toolbarWidth - toolbarPadding });
}

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