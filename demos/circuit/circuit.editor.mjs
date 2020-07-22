// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "./js/circuit.mjs";
import * as circuit_utils from "./js/circuit.utils.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Import canvas renderer
// NOTE: The editor doesn't interface with this directly, but we need to ensure it gets loaded (and registered)
import * as circuit_canvas from "../renderers/circuit.render.canvas.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// External dependencies
const jqueryLib = "third-party/jquery/jquery.js";			// jQuery
const jqueryUILib = "third-party/jquery/jquery-ui.min.js";	// jQuery UI (js)
const jqueryCss = "third-party/jquery/jquery-ui.min.css";	// jQuery UI (css)
const editorCss = "circuit.editor.css";						// Editor css

// -------------------------------------------------------------------------------------------------------------------------
// Data
var workspace = null;

// -------------------------------------------------------------------------------------------------------------------------
// Components
var canvas = null, componentPicker = null, toolbar = null;

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

	// Grab canvas
	canvas = $("#circuit_canvas");

	// Setup component picker
	initComponentPicker();

	// Setup toolbar
	toolbar = $("#editor_toolbar");
	var toolbarWidth = 600;
	var toolbarPadding = 30;
	var windowWidth = $(window).width();
	toolbar.dialog({ width: toolbarWidth, height:50, closeOnEscape: false });
	$("div[aria-describedby='editor_toolbar']").offset({ top: toolbarPadding, left: windowWidth - toolbarWidth - toolbarPadding });

	// Create single workspace for editor
	var workspaceCanvas = $("#editor_canvas");
	workspace = circuit.createWorkspace("editor", workspaceCanvas);
}

// -------------------------------------------------------------------------------------------------------------------------

function initComponentPicker()
{
	// Setup component picker dialog
	var componentPickerWidth = 300, componentPickerPadding = 30;
	componentPicker = $("#editor_component_picker");
	componentPicker.dialog({ width: componentPickerWidth, closeOnEscape: false });

	// Set component picker initial position
	$("div[aria-describedby='editor_component_picker']").offset({ top: componentPickerPadding, left: componentPickerPadding });

	// Grab component descriptors and sort by category
	var componentRegistry = circuit.getComponentRegistry();
	var componentDescriptors = Object.values(componentRegistry);
	componentDescriptors.sort((a, b) => (a.category > b.category) ? 1 : ((b.category > a.category) ? -1 : 0));

	// Populate components picker
	var currentCategory = "", firstCategory = true;
	for (var i = 0; i < componentDescriptors.length; ++i)
	{
		var componentDescriptor = componentDescriptors[i];

		// Ignore components without a widget
		var componentWidget = componentDescriptor.widget;
		if(componentWidget == null)
		{
			continue;
		}

		// Create category header?
		var category = componentWidget.descriptor.category;
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

		// Create entry
		var componentDisplayName = componentWidget.descriptor.displayName;
		var componentDescription = componentWidget.descriptor.description;
		componentPicker.append(`- ${componentDisplayName}<br>`);
	}
	return;
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