// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "./circuit.mjs";
import * as circuit_util from "./circuit.utils.mjs";

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
		return;
	}

	// Add to registry
	console.log(`Renderer '${rendererName}': Registered`);
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
	if(!(typeof renderer.viewPositionToWorkspacePosition === 'function'))
	{
		return { value: false, message: "Renderer has no viewPositionToWorkspacePosition function" };
	}
	if(!(typeof renderer.workspacePositionToViewPosition === 'function'))
	{
		return { value: false, message: "Renderer has no workspacePositionToViewPosition function" };
	}
	return { value: true, message: "" };
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
	if(!widgetDescriptor.hasOwnProperty("name"))
	{
		return { value: false, message: "Widget descriptor has no 'name' field" };
	}
	if(!widgetDescriptor.hasOwnProperty("displayName"))
	{
		return { value: false, message: "Widget descriptor has no 'displayName' field" };
	}
	if(!widgetDescriptor.hasOwnProperty("description"))
	{
		return { value: false, message: "Widget descriptor has no 'description' field" };
	}
	if(!widgetDescriptor.hasOwnProperty("category"))
	{
		return { value: false, message: "Widget descriptor has no 'catgeory' field" };
	}
	if(!widgetDescriptor.hasOwnProperty("image"))
	{
		return { value: false, message: "Widget descriptor has no 'image' field" };
	}
	if(!widgetDescriptor.hasOwnProperty("imageIcon"))
	{
		return { value: false, message: "Widget descriptor has no 'imageIcon' field" };
	}
	if(!widgetDescriptor.hasOwnProperty("version"))
	{
		return { value: false, message: "Widget descriptor has no 'version' field" };
	}
	if(!(typeof widgetDescriptor.create === 'function'))
	{
		return { value: false, message: "Widget descriptor has no 'create' function" };
	}
	return { value: true, message: "" };
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
		widgetInstance.image = await circuit_util.loadImage(widgetImageUrl);

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