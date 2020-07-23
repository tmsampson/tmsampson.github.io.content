// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "./circuit.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Registration
var rendererRegistry = { };
var widgetRegistry = { }

// -------------------------------------------------------------------------------------------------------------------------
// Data
var renderers = [];

// -------------------------------------------------------------------------------------------------------------------------

function registerRenderer(rendererDescriptor)
{
	// Check to ensure this renderer is not already registered
	var rendererName = rendererDescriptor.name;
	console.log(`Registering renderer: ${rendererName}`);
	if(rendererRegistry.hasOwnProperty(rendererName))
	{
		console.error(`Renderer '${rendererName}' already registered`);
		return;
	}

	// Add to registry
	rendererRegistry[rendererName] = rendererDescriptor;
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
	initComponentWidgets();
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

async function initRenderers()
{
	// For each registered renderer....
	for (var rendererName in rendererRegistry)
	{
		// Create renderer
		console.log(`Initialising renderer: ${rendererName}`);
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
			console.error(`Renderer ${rendererName} failed to load`);
			return false;
		}

		// Store renderer
		renderers.push(renderer);
	}

	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

function createRenderer(descriptor)
{
	// Create component instance and set name
	var renderer = descriptor.create();
	if(renderer == null)
	{
		return { value: null, message: `Renderer ${rendererName} has not been registered` };
	}

	// Store descriptor onto renderer
	renderer.descriptor = descriptor;

	// Validate renderer instance
	var validationResult = validateRenderer(renderer);
	if(!validationResult.value)
	{
		return { value: null, message: validationResult.message };
	}

	// Component successfully created
	return { value: renderer, message: "" };
}

// -------------------------------------------------------------------------------------------------------------------------

function validateRenderer(renderer)
{
	if(!(typeof renderer.load === 'function'))
	{
		return { value: false, message: "Renderer has no init function" };
	}
	if(!(typeof renderer.onCreateWorkspace === 'function'))
	{
		return { value: false, message: "Renderer has no onCreateWorkspace function" };
	}
	return { value: true, message: "" };
}

// -------------------------------------------------------------------------------------------------------------------------
// Widgets
function registerComponentWidget(widgetDescriptor)
{
	// Check to ensure that a widget for this component is not already registered
	var componentName = widgetDescriptor.name;
	if(widgetRegistry.hasOwnProperty(componentName))
	{
		console.error(`Widget for component '${componentName}' already registered`);
		return;
	}

	// Add to registry
	widgetRegistry[componentName] = widgetDescriptor;
	console.log(`Registering widget: ${componentName}`);
}

// -------------------------------------------------------------------------------------------------------------------------

function initComponentWidgets()
{
	// For each registered widget....
	for (var widgetName in widgetRegistry)
	{
		// Check to find a component with a name matching the one provided by the widget
		var componentDescriptor = circuit.getComponentDescriptor(widgetName);
		if(componentDescriptor == null)
		{
			console.error(`Could not find matching component for '${widgetName}' widget`);
			return;
		}

		// Create widget renderer and inject into component descriptor
		var widgetDescriptor = widgetRegistry[widgetName];
		componentDescriptor.widget = widgetDescriptor.create();

		// Store descriptor onto widget
		componentDescriptor.widget.descriptor = widgetDescriptor;
	}
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
export { registerRenderer, registerComponentWidget, init, onCreateWorkspace }