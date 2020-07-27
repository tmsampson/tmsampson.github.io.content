// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "./circuit.mjs";
import * as circuit_utils from "./circuit.utils.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Registration
var rendererRegistry = { };
var widgetRegistry = { }

// -------------------------------------------------------------------------------------------------------------------------
// Data
var circuitRoot = "./"
var renderers = [];

// -------------------------------------------------------------------------------------------------------------------------

function registerRenderer(rendererDescriptor)
{
	// Check to ensure this renderer is not already registered
	var rendererName = rendererDescriptor.name;
	if(rendererRegistry.hasOwnProperty(rendererName))
	{
		console.error(`Renderer '${rendererName}': Already registered`);
		return false;
	}

	// Validate renderer descriptor
	var validationResult = validateRendererDescriptor(rendererDescriptor);
	if(!validationResult.value)
	{
		console.error(`Renderer '${rendererName}': Descriptor validation failed. ${validationResult.message}`);
		return false;
	}

	// Add to registry
	console.log(`Renderer '${rendererName}': Registered`);
	rendererRegistry[rendererName] = rendererDescriptor;
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

async function init()
{
	console.log("Initialising render layer");
	
	// Initialise renderers
	if(!await initRenderers())
	{
		return false;
	}

	// Warn if running without a renderer
	// NOTE: This is completely fine, circuit is designed to allow "headless" execution
	if(renderers.length == 0)
	{
		console.log("No registered renderers");
		return true;
	}

	// Initialise registered component widgets
	await initComponentWidgets();
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

async function initRenderers()
{
	// For each registered renderer....
	for (var rendererName in rendererRegistry)
	{
		// Create renderer
		console.log(`Renderer '${rendererName}': Initialising`);
		var rendererDescriptor = rendererRegistry[rendererName];
		var result = createRenderer(rendererDescriptor);

		// Handle failures
		var renderer = result.value;
		if(renderer == null)
		{
			console.error(result.message);
			return false;
		}

		// Load renderer
		if(!await renderer.load())
		{
			console.error(`Renderer '${rendererName}': Failed to load`);
			return false;
		}

		// Store renderer
		renderers.push(renderer);
	}

	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

function createRenderer(rendererDescriptor)
{
	// Create renderer
	var rendererName = rendererDescriptor.name;
	var rendererInstance = rendererDescriptor.create();
	if(rendererInstance == null)
	{
		return { value: null, message: `Renderer '${rendererName}': Creation failed` };
	}

	// Store descriptor onto renderer
	rendererInstance.descriptor = rendererDescriptor;

	// Validate renderer instance
	var validationResult = validateRendererInstance(rendererInstance);
	if(!validationResult.value)
	{
		return { value: null, message: `Renderer '${rendererName}': Validation failed. ${validationResult.message}` };
	}

	// Component successfully created
	return { value: rendererInstance, message: "" };
}

// -------------------------------------------------------------------------------------------------------------------------

function validateRendererDescriptor(rendererDescriptor)
{
	var requiredFields = [ "name", "description", "version"];
	var requiredFunctions = [ "create" ];
	return circuit_utils.validateObject(rendererDescriptor, requiredFields, requiredFunctions);
}

// -------------------------------------------------------------------------------------------------------------------------

function validateRendererInstance(renderer)
{
	var requiredFields = [];
	var requiredFunctions = [ "load", "onCreateWorkspace", "viewPositionToWorkspacePosition", "workspacePositionToViewPosition" ];
	return circuit_utils.validateObject(renderer, requiredFields, requiredFunctions);
}

// -------------------------------------------------------------------------------------------------------------------------

function getRenderers()
{
	return renderers;
}

// -------------------------------------------------------------------------------------------------------------------------
// Widgets
function registerComponentWidget(widgetDescriptor)
{
	// Check to ensure that a widget for this component is not already registered
	var componentName = widgetDescriptor.name;
	if(widgetRegistry.hasOwnProperty(componentName))
	{
		console.error(`Widget '${componentName}': Already registered`);
		return false;
	}

	// Validate widget descriptor
	var validationResult = validateWidgetDescriptor(widgetDescriptor);
	if(!validationResult.value)
	{
		console.error(`Widget '${componentName}': Descriptor validation failed. ${validationResult.message}`);
		return false;
	}

	// Add to registry
	widgetRegistry[componentName] = widgetDescriptor;
	console.log(`Widget '${componentName}': Registered`);
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

function validateWidgetDescriptor(widgetDescriptor)
{
	var requiredFields = [ "name", "displayName", "description", "category", "image", "imageIcon", "version"];
	var requiredFunctions = [ "create" ];
	return circuit_utils.validateObject(widgetDescriptor, requiredFields, requiredFunctions);
}

// -------------------------------------------------------------------------------------------------------------------------

async function initComponentWidgets()
{
	// For each registered widget....
	for (var widgetName in widgetRegistry)
	{
		// Check to find a component with a name matching the one provided by the widget
		var componentDescriptor = circuit.getComponentDescriptor(widgetName);
		if(componentDescriptor == null)
		{
			console.error(`Widget '${widgetName}': Could not find matching registered component`);
			continue;
		}

		// Create widget instance
		var widgetDescriptor = widgetRegistry[widgetName];
		var widgetInstance = widgetDescriptor.create();

		// Validate widget descriptor
		var validationResult = validateWidgetInstance(widgetInstance);
		if(!validationResult.value)
		{
			console.error(`Widget '${componentName}': Instance validation failed. ${validationResult.message}`);
			continue;
		}

		// Load widget image
		var componentName = widgetName;
		var widgetImageUrl = `${circuitRoot}components/${componentName}/img/${widgetDescriptor.image.file}`;
		widgetInstance.image = await circuit_utils.loadImage(widgetImageUrl);

		// Store widget descriptor onto widget
		widgetInstance.descriptor = widgetDescriptor;

		// Store widget onto component descriptor
		componentDescriptor.widget = widgetInstance;
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function validateWidgetInstance(widgetInstance)
{
	return { value: true, message: "" };
}

// -------------------------------------------------------------------------------------------------------------------------
// Workspaces
function onCreateWorkspace(workspace, renderContainer)
{
	// Forward to all renderers
	for(var i = 0; i < renderers.length; ++i)
	{
		var renderer = renderers[i];
		renderer.onCreateWorkspace(workspace, renderContainer);
	}
}

// -------------------------------------------------------------------------------------------------------------------------
// Exports
export
{
	registerRenderer,
	getRenderers,
	registerComponentWidget,
	init,
	onCreateWorkspace
}

// -------------------------------------------------------------------------------------------------------------------------