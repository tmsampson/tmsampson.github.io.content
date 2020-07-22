// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "./circuit.mjs";
import * as circuit_utils from "./circuit.utils.mjs";
import * as circuit_render from "./circuit.render.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// External dependencies
const jqueryLib = "third-party/jquery/jquery.js";
const jqueryUILib = "third-party/jquery/jquery-ui.min.js";
const jqueryCss = "third-party/jquery/jquery-ui.min.css";
const editorCss = "css/circuit.editor.css";

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
	// Load dependencies
	if(!await loadDependencies())
	{
		console.error("Failed to load dependencies");
	}

	// Init ciruit
	await circuit.init();

	// Grab canvas
	canvas = $("#circuit_canvas");

	// Setup component picker
	componentPicker = $("#editor_component_picker");
	var componentPickerWidth = 300;
	var componentPickerPadding = 30;
	componentPicker.dialog({ width: componentPickerWidth, closeOnEscape: false });
	$("div[aria-describedby='editor_component_picker']").offset({ top: componentPickerPadding, left: componentPickerPadding });

	// Setup toolbar
	toolbar = $("#editor_toolbar");
	var toolbarWidth = 600;
	var toolbarPadding = 30;
	var windowWidth = $(window).width();
	toolbar.dialog({ width: toolbarWidth, height:50, closeOnEscape: false });
	$("div[aria-describedby='editor_toolbar']").offset({ top: toolbarPadding, left: windowWidth - toolbarWidth - toolbarPadding });

	// Add workspace
	workspace = circuit.createWorkspace("editor");
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