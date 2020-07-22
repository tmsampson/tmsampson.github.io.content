// -------------------------------------------------------------------------------------------------------------------------
// Imports
import * as circuit_render from "./circuit.render.mjs"

// -------------------------------------------------------------------------------------------------------------------------
// Constants
export const version = "1.0.0.0";

// -------------------------------------------------------------------------------------------------------------------------
// Registry
var componentRegistry = { };

// -------------------------------------------------------------------------------------------------------------------------
// Rendering (optional)
var renderer = null;

// -------------------------------------------------------------------------------------------------------------------------
// Init
async function init()
{
	// Initialise and load render later (optional)
	if(await circuit_render.init())
	{
		renderer = circuit_render.getRenderer();
	}
}

// -------------------------------------------------------------------------------------------------------------------------
// Workspace
function createWorkspace(name, renderContainer)
{
	var workspace = null;

	// Bind renderer (optional)
	if(renderer != null && renderContainer != null)
	{
		renderer.createWorkspace(workspace, renderContainer);
	}

	return workspace;
}

// -------------------------------------------------------------------------------------------------------------------------
// Components
function registerComponent(componentDescriptor)
{
	// Check to ensure this component is not already registered
	var componentName = componentDescriptor.name;
	if(componentRegistry.hasOwnProperty(componentName))
	{
		console.error(`Component '${componentName}' already registered`);
		return;
	}

	// Add to registry
	componentRegistry[componentName] = componentDescriptor;
	console.log(`Registering component: ${componentName}`);
};

// -------------------------------------------------------------------------------------------------------------------------

function validateComponent(component)
{
	if(!component.hasOwnProperty("descriptor"))
	{
		return { value: false, message: "Component has no descriptor" };
	}
	if(!component.descriptor.hasOwnProperty("name"))
	{
		return { value: false, message: "Component has no name" };
	}
	if(!component.descriptor.hasOwnProperty("category"))
	{
		return { value: false, message: "Component has no category" };
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

function getComponentDescriptor(componentName)
{
	// Check to ensure this component is not already registered
	if(!componentRegistry.hasOwnProperty(componentName))
	{
		console.error(`Could not find descriptor for component '${componentName}'`);
		return null;
	}

	// Return descriptor
	return componentRegistry[componentName];
}

// -------------------------------------------------------------------------------------------------------------------------

function getComponentRegistry()
{
	return componentRegistry;
}

// -------------------------------------------------------------------------------------------------------------------------
// Exports
export { init, registerComponent, createWorkspace, createComponent, getComponentRegistry, getComponentDescriptor }

// -------------------------------------------------------------------------------------------------------------------------