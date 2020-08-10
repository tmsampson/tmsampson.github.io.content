// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "./circuit.mjs";
import * as circuit_utils from "./circuit.utils.mjs";

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
		this.connections =
		{
			all: [],               // Flat list
			byInputComponent: { }, // Input component --> connectionInfo
			byOutputComponent: { } // Output component --> connectionInfo
		};
	}

	// ---------------------------------------------------------------------------------------------------------------------
	// Components
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

		// Store workspace on component
		componentInstance.workspace = this;

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

	getComponentPosition(componentInstance)
	{
		return componentInstance.args.position;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	setComponentPosition(componentInstance, newPosition)
	{
		// Check to ensure that the component belongs to this workspace
		if(componentInstance.workspace != this)
		{
			console.log(`Workspace '${this.name}': Cannot modify component '${componentName}' as it does not belong to this workspace`);
			return false;
		}

		// Move component
		componentInstance.args.position = newPosition;
		return true;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	generateComponentId()
	{
		// For now, just use a counter
		return this.components.length;
	}

	// ---------------------------------------------------------------------------------------------------------------------
	// Connections
	addConnection(connectionInfo)
	{
		// Valiate connection object
		var connectionResult = circuit_utils.validateObject(connectionInfo, ["sourcePinInfo", "targetPinInfo"], []);
		if(!connectionResult.value)
		{
			console.error(`Connection failed. Invalid connection object: ${connectionResult.message}`);
			return false;
		}

		// Validate source pin
		var sourcePinInfo = connectionInfo.sourcePinInfo;
		var sourcePinResult = circuit_utils.validateObject(sourcePinInfo, ["component", "type", "index"], []);
		if(!sourcePinResult.value)
		{
			console.error(`Connection failed. Invalid source pin info: ${sourcePinResult.message}`);
			return false;
		}

		// Validate target pin
		var targetPinInfo = connectionInfo.targetPinInfo;
		var targetPinResult = circuit_utils.validateObject(targetPinInfo, ["component", "type", "index"], []);
		if(!targetPinResult.value)
		{
			console.error(`Connection failed. Invalid target pin info: ${targetPinResult.message}`);
			return false;
		}

		// For now, only allow connecting outputs to inputs
		if(sourcePinInfo.type != circuit.PinType.OUTPUT || targetPinInfo.type != circuit.PinType.INPUT)
		{
			console.error(`Connection failed. For now, connections must go from output pin to input pin only`);
			return false;
		}

		// Grab components
		var sourceComponent = sourcePinInfo.component;
		var targetComponent = targetPinInfo.component;

		// Validate input pin index
		var sourcePinType = circuit.PinType.OUTPUT, sourcePinIndex = sourcePinInfo.index, sourceInputArray = sourceComponent.outputs;
		if(sourcePinInfo.index >= sourceInputArray.length)
		{
			console.error(`Connection failed. Source ${sourcePinType} pin index ${sourcePinIndex} is invalid.`);
			console.error(`Component only has ${sourceInputArray.length} ${sourcePinType} pins!"`);
			return false;
		} 

		// Validate output pin index
		var targetPinType = circuit.PinType.INPUT, targetPinIndex = targetPinInfo.index, targetInputArray = targetComponent.inputs;
		if(targetPinInfo.index >= targetInputArray.length)
		{
			console.error(`Connection failed. Target ${targetPinType} pin index ${targetPinIndex} is invalid.`);
			console.error(`Component only has ${targetInputArray.length} pins!"`);
			return false;
		}

		// Check for duplicate connections
		var existingConnections = this.connections.byOutputComponent[sourceComponent];
		if(existingConnections != null)
		{
			for(var existingConnectionIndex = 0; existingConnectionIndex < existingConnections.length; ++existingConnectionIndex)
			{
				var existingConnectionInfo = existingConnections[existingConnectionIndex];
				if(existingConnectionInfo.targetPinInfo.component == targetComponent)
				{
					if(existingConnectionInfo.sourcePinInfo.index == sourcePinIndex && existingConnectionInfo.targetPinInfo.index == targetPinIndex)
					{
						// Duplicate detected
						console.error("Connection failed. Duplicate connection detected");
						return false;
					}
				}
			}
		}

		// Store connection
		// NOTE: Connections are maintained across several containers for optimal lookup/traversal
		this.connections.all.push(connectionInfo);
		if(this.connections.byOutputComponent.hasOwnProperty(sourceComponent))
		{
			this.connections.byOutputComponent[sourceComponent].push(connectionInfo);
		}
		else
		{
			this.connections.byOutputComponent[sourceComponent] = [ connectionInfo ];
		}
		if(this.connections.byInputComponent.hasOwnProperty(targetComponent))
		{
			this.connections.byInputComponent[targetComponent].push(connectionInfo);
		}
		else
		{
			this.connections.byInputComponent[targetComponent] = [ connectionInfo ];
		}

		// Log
		var sourceLog = `${sourceComponent.descriptor.name} component (#${sourceComponent.id}) ${sourcePinType} pin ${sourcePinIndex}`;
		var targetLog = `${targetComponent.descriptor.name} component (#${targetComponent.id}) ${targetPinType} pin ${targetPinIndex}`;
		console.log(`Connection added: ${sourceLog} --> ${targetLog}`);
		return true;
	}

	// ---------------------------------------------------------------------------------------------------------------------

	getConnections()
	{
		return this.connections.all;
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