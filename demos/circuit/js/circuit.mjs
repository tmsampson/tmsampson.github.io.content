// -------------------------------------------------------------------------------------------------------------------------
// Imports
import * as circuit_render from "./circuit.render.mjs"
import * as circuit_workspace from "./circuit.workspace.mjs"
import * as circuit_utils from "./circuit.utils.mjs"

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
		return false;
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
	return true;
};

// -------------------------------------------------------------------------------------------------------------------------

function validateComponentDescriptor(componentDescriptor)
{
	var requiredFields = [ "name", "version" ];
	var reqiredFunctions = [ "create" ];
	return circuit_utils.validateObject(componentDescriptor, requiredFields, reqiredFunctions);
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
	var requiredFields = [ "descriptor", "inputs", "outputs" ];
	var reqiredFunctions = [ "update" ];
	return circuit_utils.validateObject(component, requiredFields, reqiredFunctions);
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