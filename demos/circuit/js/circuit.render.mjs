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
var renderers = { };
var renderLoopStarted = false;

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
	if(!await loadRenderers())
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

async function loadRenderers()
{
	// For each registered renderer....
	for (var rendererName in rendererRegistry)
	{
		// Create renderer
		console.log(`Renderer '${rendererName}': Initialising`);
		var rendererDescriptor = rendererRegistry[rendererName];
		
		// Load renderer
		if(!await rendererDescriptor.load())
		{
			console.error(`Renderer '${rendererName}': Failed to load`);
			return false;
		}
	}
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

function validateRendererDescriptor(rendererDescriptor)
{
	var requiredFields = [ "name", "description", "version"];
	var requiredFunctions = [ "load", "create" ];
	return circuit_utils.validateObject(rendererDescriptor, requiredFields, requiredFunctions);
}

// -------------------------------------------------------------------------------------------------------------------------

function validateRendererInstance(renderer)
{
	var requiredFields = [ ];
	var requiredFunctions =
	[
		"onUpdate", "onRender",
		"setGridVisible", "getGridSnapSpacing", "setGridSnapSpacing",
		"setShowRenderStats", "userIsInteracting",
		"getCursorInfo",
		"renderTemporaryConnection", "clearTemporaryConnection"
	];
	return circuit_utils.validateObject(renderer, requiredFields, requiredFunctions);
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
	var requiredFields = [ "name", "displayName", "description", "category", "images", "icon", "version"];
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
		console.log(`Widget '${widgetName}': Initialising`);
		var widgetDescriptor = widgetRegistry[widgetName];
		var widgetInstance = widgetDescriptor.create();

		// Validate widget descriptor
		var validationResult = validateWidgetInstance(widgetInstance);
		if(!validationResult.value)
		{
			console.error(`Widget '${widgetName}': Instance validation failed. ${validationResult.message}`);
			continue;
		}

		// Load widget images
		var componentName = widgetName;
		var widgetImageRoot = `${circuitRoot}components/${componentName}/img`;
		for(var widgetImageName in widgetDescriptor.images)
		{
			// Validate image descriptor
			var widgetImageDescriptor = widgetDescriptor.images[widgetImageName];
			var imageDescriptorValidationResult = validateWidgetImageDescriptor(widgetImageDescriptor);
			if(!imageDescriptorValidationResult)
			{
				console.error(`Widget '${widgetName}': Image '${widgetImageName}' descriptor validation failed. ${imageDescriptorValidationResult.message}`);
				continue;
			}

			// Load image
			var widgetImageSrc = `${widgetImageRoot}/${widgetImageDescriptor.file}`;
			var loadedImage = await circuit_utils.loadImage(widgetImageSrc);
			if(loadedImage == null)
			{
				console.error(`Widget '${widgetName}': Image '${widgetImageName}' failed to load (${widgetImageSrc})`);
				continue;
			}

			// Store loaded image onto descriptor
			console.log(`    - Widget '${widgetName}': Image '${widgetImageName}' loaded`);
			widgetImageDescriptor.loadedImage = loadedImage;
		}

		// Store widget descriptor onto widget
		widgetInstance.descriptor = widgetDescriptor;

		// Store widget onto component descriptor
		componentDescriptor.widget = widgetInstance;
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function validateWidgetInstance(widgetInstance)
{
	var requiredFields = [ ], requiredFunctions = [ "getRenderImage" ];
	return circuit_utils.validateObject(widgetInstance, requiredFields, requiredFunctions);
}

// -------------------------------------------------------------------------------------------------------------------------

function validateWidgetImageDescriptor(widgetImageDescriptor)
{
	var requiredFields = [ "file" ], requiredFunctions = [ ];
	return circuit_utils.validateObject(widgetImageDescriptor, requiredFields, requiredFunctions);
}

// -------------------------------------------------------------------------------------------------------------------------
// Workspaces
function onCreateWorkspace(workspace, containerElement)
{
	// Ignore if no workspace or container was provided
	if(workspace == null || containerElement == null)
	{
		return;
	}

	// For each registered renderer....
	var renderInstanceRegistered = false;
	for (var rendererName in rendererRegistry)
	{
		// Create renderer for this workspace
		var rendererDescriptor = rendererRegistry[rendererName];
		var rendererInstance = rendererDescriptor.create(workspace, containerElement);
		if(rendererInstance == null)
		{
			console.error(`Failed to create renderer '${rendererName}' for workspace '${workspace.name}'`);
			continue;
		}

		// Validate renderer instance
		var validationResult = validateRendererInstance(rendererInstance);
		if(!validationResult.value)
		{
			console.error(`Renderer '${rendererName}': Validation failed. ${validationResult.message}`);
			return null;
		}

		// Store renderer instance for this workspace
		if(workspace in renderers)
		{
			renderers[workspace].push(rendererInstance);
		}
		else
		{
			renderers[workspace] = [ rendererInstance ];
		}
		renderInstanceRegistered = true;
	}

	// Start render loop?
	if(renderInstanceRegistered && !renderLoopStarted)
	{
		// Start render loop
		renderLoopStarted = true;
		var previousTimestamp, firstFrame = true;
		var renderLoop = (timestamp) =>
		{
			// Calculate dt
			if(firstFrame) { previousTimestamp = timestamp };
			var deltaMs = (timestamp - previousTimestamp);
			var deltaS = deltaMs / 1000;
			previousTimestamp = timestamp;

			// Update and render
			onUpdate(deltaS);
			onRender(deltaS);

			// Request next frame
			firstFrame = false;
			window.requestAnimationFrame(renderLoop);
		};
		window.requestAnimationFrame(renderLoop);
	}
}

// -------------------------------------------------------------------------------------------------------------------------
// Render loop
function onUpdate(deltaS)
{
	// Update all renderers
	for (var workspace in renderers)
	{
		var rendererInstances = renderers[workspace];
		for(var i = 0; i < rendererInstances.length; ++i)
		{
			var rendererInstance = rendererInstances[i];
			rendererInstance.onUpdate(deltaS);
		}
	}
}

// -------------------------------------------------------------------------------------------------------------------------

function onRender(deltaS)
{
	// Render all renderers
	for (var workspace in renderers)
	{
		var rendererInstances = renderers[workspace];
		for(var i = 0; i < rendererInstances.length; ++i)
		{
			var rendererInstance = rendererInstances[i];
			rendererInstance.onRender(deltaS);
		}
	}
}

// -------------------------------------------------------------------------------------------------------------------------
// Access
function getRenderer(workspace)
{
	// For now, return first available renderer for this workspace
	var haveRenderer = (workspace in renderers);
	return haveRenderer? renderers[workspace][0] : null;
}

// -------------------------------------------------------------------------------------------------------------------------
// Exports
export
{
	registerRenderer,
	registerComponentWidget,
	init,
	onCreateWorkspace,
	getRenderer
}

// -------------------------------------------------------------------------------------------------------------------------