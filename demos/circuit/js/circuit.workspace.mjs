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

		// Assign ID
		componentInstance.id = this.generateComponentId();

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
		var componentDescriptor = circuit.getComponentDescriptor(componentName);
		if(componentInstance == null)
		{
			console.log(`Workspace '${this.name}': Adding component '${componentName}' failed`);
			return null;
		}

		// Add component using descriptor
		return this.addComponent(componentDescriptor);
	}

	// ---------------------------------------------------------------------------------------------------------------------

	generateComponentId()
	{
		// For now, just use a counter
		return this.components.length;
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