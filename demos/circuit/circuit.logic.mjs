// -------------------------------------------------------------------------------------------------------------------------
// Constants
export const version = "1.0.0.0";

// -------------------------------------------------------------------------------------------------------------------------
// Registry
var componentRegistry = { };
var rendererRegistry = { };

// -------------------------------------------------------------------------------------------------------------------------
// Renderer
var renderer = null;

// -------------------------------------------------------------------------------------------------------------------------
// Init
window.onload = function()
{
	// For now, create and init first registered renderer
	// NOTE: May allow selecting/swapping renderer later
	for(var rendererName in rendererRegistry)
	{
		var rendererDescriptor = rendererRegistry[rendererName];
		var result = createRenderer(rendererDescriptor);
		if(result.value)
		{
			renderer = result.value;
			renderer.init();
			break;
		}
		else
		{
			console.error(result.message);
		}
	}

	// Test
	var result = createComponent(componentRegistry["nand"]);
	if(!result.value)
	{
		console.error(result.message);
		return;
	}
	var c = result.value;
	c.update();
};

// -------------------------------------------------------------------------------------------------------------------------
// Components
function registerComponent(descriptor)
{
	// Check to ensure this component is not already registered
	var componentName = descriptor.name;
	if(componentRegistry.hasOwnProperty(componentName))
	{
		console.error(`Component '${componentName}' already registered`);
		return;
	}

	// Add to registry
	componentRegistry[componentName] = descriptor;
	console.log(`Registering component: ${componentName}`);
};

// -------------------------------------------------------------------------------------------------------------------------

function validateComponent(component)
{
	if(!component.hasOwnProperty("descriptor"))
	{
		return { value: false, message: "Component has no descriptor" };
	}
	if(!component.hasOwnProperty("inputs"))
	{
		return { value: false, message: "Component has no inputs (please provide empty array if no inputs are required)" };
	}
	if(!component.hasOwnProperty("outputs"))
	{
		return { value: false, message: "Component has no outputs (please provide empty array if no outputs are required)" };
	}
	if(!(typeof component.update === 'function'))
	{
		return { value: false, message: "Component has no update function" };
	}
	return { value: true, message: "" };
}

// -------------------------------------------------------------------------------------------------------------------------

function createComponent(descriptor)
{
	// Check to ensure this component is registered
	var componentName = descriptor.name;
	if(!componentRegistry.hasOwnProperty(componentName))
	{
		return { value: null, message: `Component ${componentName} has not been registered` };
	}

	// Create component instance and set name
	var component = componentRegistry[componentName].create();
	if(component == null)
	{
		return { value: null, message: `Component ${componentName} has not been registered` };
	}

	// Store descriptor onto component
	component.descriptor = descriptor;

	// Validate component instance
	var validationResult = validateComponent(component);
	if(!validationResult.value)
	{
		return { value: null, message: validationResult.message };
	}

	// Component successfully created
	return { value: component, message: "" };
}

// -------------------------------------------------------------------------------------------------------------------------
// Renderer
function registerRenderer(descriptor)
{
	// Check to ensure this renderer is not already registered
	var rendererName = descriptor.name;
	if(rendererRegistry.hasOwnProperty(rendererName))
	{
		console.error(`Renderer '${componentName}' already registered`);
		return;
	}

	// Add to registry
	rendererRegistry[rendererName] = descriptor;
	console.log(`Registering renderer: ${rendererName}`);
}

// -------------------------------------------------------------------------------------------------------------------------

function validateRenderer(renderer)
{
	if(!(typeof renderer.init === 'function'))
	{
		return { value: false, message: "Renderer has no init function" };
	}
	return { value: true, message: "" };
}

// -------------------------------------------------------------------------------------------------------------------------

function createRenderer(descriptor)
{
	// Check to ensure this component is registered
	var rendererName = descriptor.name;
	if(!rendererRegistry.hasOwnProperty(rendererName))
	{
		return { value: null, message: `Renderer ${rendererName} has not been registered` };
	}

	// Create component instance and set name
	var renderer = rendererRegistry[rendererName].create();
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
// Exports
export { registerComponent, registerRenderer }

// -------------------------------------------------------------------------------------------------------------------------