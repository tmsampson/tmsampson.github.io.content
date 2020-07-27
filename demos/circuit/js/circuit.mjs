// -------------------------------------------------------------------------------------------------------------------------
// Imports
import * as circuit_render from "./circuit.render.mjs"
import * as circuit_workspace from "./circuit.workspace.mjs"

// -------------------------------------------------------------------------------------------------------------------------
// Constants
export const version = "1.0.0.0";

// -------------------------------------------------------------------------------------------------------------------------
// Registry
var componentRegistry = { };

// -------------------------------------------------------------------------------------------------------------------------
// Init
async function init()
{
	// Initialise and load render layer
	if(!await circuit_render.init())
	{
		console.error("Failed to initialise render layer")
		return false;
	}
}

// -------------------------------------------------------------------------------------------------------------------------
// Workspace
function createWorkspace(name, renderContainer)
{
	// Create workspace
	var workspace = circuit_workspace.create(name);

	// Inform render layer (only if caller provided a render container)
	if(renderContainer != null)
	{
		circuit_render.onCreateWorkspace(workspace, renderContainer);
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
		console.error(`Component '${componentName}': Already registered`);
		return;
	}

	// Validate component descriptor
	var validationResult = validateComponentDescriptor(componentDescriptor);
	if(!validationResult.value)
	{
		console.error(`Component '${componentName}': Descriptor validation failed. ${validationResult.message}`);
		return false;
	}

	// Add to registry
	componentRegistry[componentName] = componentDescriptor;
	console.log(`Component '${componentName}': Registered`);
};

// -------------------------------------------------------------------------------------------------------------------------

function validateComponentDescriptor(componentDescriptor)
{
	if(!componentDescriptor.hasOwnProperty("name"))
	{
		return { value: false, message: "Component descriptor has no 'name' field" };
	}
	if(!componentDescriptor.hasOwnProperty("version"))
	{
		return { value: false, message: "Component descriptor has no 'version' field" };
	}
	if(!(typeof componentDescriptor.create === 'function'))
	{
		return { value: false, message: "Component descriptor has no 'create' function" };
	}
	return { value: true, message: "" };
}

// -------------------------------------------------------------------------------------------------------------------------

function createComponent(descriptor, args)
{
	// Check to ensure this component is registered
	var componentName = descriptor.name;
	if(!componentRegistry.hasOwnProperty(componentName))
	{
		return { value: null, message: `Component '${componentName}': Was not registered` };
	}

	// Create component instance and set name
	var component = componentRegistry[componentName].create();
	if(component == null)
	{
		return { value: null, message: `Component '${componentName}': Creation failed` };
	}

	// Store descriptor and args onto component
	component.descriptor = descriptor;
	component.args = args;
	
	// Validate component instance
	var validationResult = validateComponentInstance(component);
	if(!validationResult.value)
	{
		return { value: null, message: validationResult.message };
	}

	// Component successfully created
	return { value: component, message: "" };
}

// -------------------------------------------------------------------------------------------------------------------------

function createComponentByName(componentName, args)
{
	var componentDescriptor = getComponentDescriptor(componentName);
	if(componentDescriptor == null)
	{
		return null;
	}

	return createComponent(componentDescriptor, args)
}

// -------------------------------------------------------------------------------------------------------------------------

function validateComponentInstance(component)
{
	if(!component.hasOwnProperty("descriptor"))
	{
		return { value: false, message: "Component has no 'descriptor' field" };
	}
	if(!component.descriptor.hasOwnProperty("name"))
	{
		return { value: false, message: "Component descriptor has no 'name' field" };
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

function getComponentDescriptor(componentName)
{
	// Check to ensure this component is not already registered
	if(!componentRegistry.hasOwnProperty(componentName))
	{
		console.error(`Component '${componentName}': Could not find descriptor`);
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
// Rendering
function getRenderers()
{
	return circuit_render.getRenderers();
}

// -------------------------------------------------------------------------------------------------------------------------
// Exports
export
{
	init,
	registerComponent,
	createWorkspace,
	createComponent,
	createComponentByName,
	getComponentRegistry,
	getComponentDescriptor,
	getRenderers
}

// -------------------------------------------------------------------------------------------------------------------------