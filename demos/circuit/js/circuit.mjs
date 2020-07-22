// -------------------------------------------------------------------------------------------------------------------------
// Constants
export const version = "1.0.0.0";

// -------------------------------------------------------------------------------------------------------------------------
// Registry
var componentRegistry = { };

// -------------------------------------------------------------------------------------------------------------------------
// Renderer
var rendererDescriptor = null;
var renderer = null;

// -------------------------------------------------------------------------------------------------------------------------
// Init
async function init()
{
	// Create and load registered renderer (optional)
	if(rendererDescriptor != null)
	{
		var result = createRenderer(rendererDescriptor);
		if(result.value)
		{
			renderer = result.value;
			if(!await renderer.load())
			{
				console.error(`Renderer ${rendererDescriptor.name} failed to load`);
			}
		}
		else
		{
			console.error(result.message);
		}
	}
}

// -------------------------------------------------------------------------------------------------------------------------
// Workspace
function createWorkspace(name)
{
	var workspace = null;

	// Bind renderer (optional)
	if(renderer != null)
	{
		renderer.bindWorkspace(workspace);
	}

	return workspace;
}

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
	console.log(`Registering renderer: ${descriptor.name}`);
	rendererDescriptor = descriptor;
}

// -------------------------------------------------------------------------------------------------------------------------

function validateRenderer(renderer)
{
	if(!(typeof renderer.load === 'function'))
	{
		return { value: false, message: "Renderer has no init function" };
	}
	if(!(typeof renderer.bindWorkspace === 'function'))
	{
		return { value: false, message: "Renderer has no bindWorkspace function" };
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
// Exports
export { init, registerComponent, registerRenderer, createWorkspace }

// -------------------------------------------------------------------------------------------------------------------------