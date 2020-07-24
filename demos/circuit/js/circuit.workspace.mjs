// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "../../js/circuit.mjs";

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
		console.log(`Workspace '${this.name}': Adding component '${componentDescriptor.name}'`);
		var componentInstance = componentDescriptor.create();
		this.components.push(componentInstance);
		return componentInstance;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	addComponentByName(name, args)
	{
		// Go lookup in circuit registry then call addComponent
		// REMEMBER: Steal logic from circuit createComponent and then remove it
	}

	// ---------------------------------------------------------------------------------------------------------------------
}

// -------------------------------------------------------------------------------------------------------------------------
// Exports
export { create, CircuitWorkspace }