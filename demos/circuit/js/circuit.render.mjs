// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "./circuit.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Registration
var rendererDescriptor = null;
var renderer = null;
var widgetRegistry = { }

// -------------------------------------------------------------------------------------------------------------------------

function registerRenderer(descriptor)
{
	// Store renderer descriptor
	// NOTE: Renderers can register quite early in the startup process, so we store off the descriptor
	//       and defer instance creation until the proper initialisation stage
	console.log(`Registering renderer: ${descriptor.name}`);
	rendererDescriptor = descriptor;
}

// -------------------------------------------------------------------------------------------------------------------------

async function init()
{
	console.log("Initialising render layer");
	
	// Create renderer (optional)
	if(rendererDescriptor)
	{
		var rendererName = rendererDescriptor.name;
		console.log(`Initialising renderer: ${rendererName}`);
		var result = createRenderer(rendererDescriptor);
		if(result.value)
		{
			renderer = result.value;
			if(!await renderer.load())
			{
				console.error(`Renderer ${rendererDescriptor.name} failed to load`);
				return false;
			}
		}
		else
		{
			console.error(result.message);
			return false;
		}
	}
	else
	{
		console.log("No registered renderers")
		return false;
	}

	// Initialise registered component widgets
	initComponentWidgets();
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

function validateRenderer(renderer)
{
	if(!(typeof renderer.load === 'function'))
	{
		return { value: false, message: "Renderer has no init function" };
	}
	if(!(typeof renderer.createWorkspace === 'function'))
	{
		return { value: false, message: "Renderer has no createWorkspace function" };
	}
	return { value: true, message: "" };
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

function getRenderer()
{
	return renderer;
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
// Exports
export { registerRenderer, registerComponentWidget, init, getRenderer }