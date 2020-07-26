// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "./circuit.mjs";

// -------------------------------------------------------------------------------------------------------------------------

function create(name)
{
	return new CircuitWorkspace(name);
}

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class CircuitWorkspace
{
	// ---------------------------------------------------------------------------------------------------------------------

	constructor(name)
	{
		this.name = name;
		this.components = [];
	}

	// ---------------------------------------------------------------------------------------------------------------------

	addComponent(componentDescriptor, args)
	{
		// Create component instance
		var result = circuit.createComponent(componentDescriptor, args);
		var componentInstance = result.value;
		if(componentInstance == null)
		{
			console.error(result.message);
			return null;
		}

		// Add component to workspace
		console.log(`Workspace '${this.name}': Adding component '${componentDescriptor.name}'`);
		this.components.push(componentInstance);

		// Component successfully added
		return componentInstance;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	addComponentByName(componentName, args)
	{
		// Create component instance
		var componentInstance = circuit.createComponentByName(componentName, args);
		if(componentInstance == null)
		{
			return null;
		}

		// Add component to workspace
		console.log(`Workspace '${this.name}': Adding component '${componentName}'`);
		this.components.push(componentInstance);

		// Component successfully added
		return componentInstance;
	}

	// ---------------------------------------------------------------------------------------------------------------------
	
	viewPositionToWorkspacePosition(viewPosition)
	{
		// If renderer is present, ask for conversion, otherwise return unmodified view position
		var renderers = circuit.getRenderers();
		var renderer = (renderers.length > 0)? renderers[0] : null;
		return renderer? renderer.viewPositionToWorkspacePosition(this, viewPosition) : viewPosition;
	}

	// ---------------------------------------------------------------------------------------------------------------------
}

// -------------------------------------------------------------------------------------------------------------------------
// Exports
export
{
	create,
	CircuitWorkspace
}

// -------------------------------------------------------------------------------------------------------------------------