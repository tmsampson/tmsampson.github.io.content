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
		var sourcePinType = sourcePinInfo.type, sourcePinIndex = sourcePinInfo.index;
		var sourceInputArray = (sourcePinType == circuit.PinType.INPUT)? sourceComponent.inputs : sourceComponent.outputs;
		if(sourcePinInfo.index >= sourceInputArray.length)
		{
			console.error(`Connection failed. Source ${sourcePinType} pin index ${sourcePinIndex} is invalid.`);
			console.error(`Component only has ${sourceInputArray.length} ${sourcePinType} pins!"`);
			return false;
		} 

		// Validate output pin index
		var targetPinType = targetPinInfo.type, targetPinIndex = targetPinInfo.index;
		var targetInputArray = (targetPinType == circuit.PinType.INPUT)? targetComponent.inputs : targetComponent.outputs;
		if(targetPinInfo.index >= targetInputArray.length)
		{
			console.error(`Connection failed. Target ${targetPinType} pin index ${targetPinIndex} is invalid.`);
			console.error(`Component only has ${targetInputArray.length} pins!"`);
			return false;
		}

		// Grab connection info
		var sourcePinIsInput = (sourcePinType == circuit.PinType.INPUT);
		var inputComponent = sourcePinIsInput? sourceComponent : targetComponent;
		var outputComponent = sourcePinIsInput? targetComponent : sourceComponent;

		// Store connection
		// NOTE: Connections are maintained across several containers for optimal lookup/traversal
		this.connections.all.push(connectionInfo);								// Flat list
		this.connections.byInputComponent[inputComponent] = connectionInfo;		// Input component --> connectionInfo lookup
		this.connections.byOutputComponent[outputComponent] = connectionInfo;	// Input component --> connectionInfo lookup

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