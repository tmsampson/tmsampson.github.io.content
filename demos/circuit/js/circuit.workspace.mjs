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
			all: [],                // Flat list
			byOutputComponent: { }, // Output component ID --> connectionInfo
			byInputComponent: { }   // Input component ID --> connectionInfo
		};
		this.nextComponentId = 0;
		this.nextConnectionId = 0;
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
		return this.nextComponentId++;
	}

	// ---------------------------------------------------------------------------------------------------------------------
	// Connections
	addConnection(connectionInfo)
	{
		// Valiate connection object
		var connectionResult = circuit_utils.validateObject(connectionInfo, ["sourcePinInfo", "targetPinInfo"], []);
		if(!connectionResult.value)
		{
			return { value: false, message: `Invalid connection object: ${connectionResult.message}` };
		}

		// Validate source pin
		var sourcePinInfo = connectionInfo.sourcePinInfo;
		var sourcePinResult = circuit_utils.validateObject(sourcePinInfo, ["component", "type", "index"], []);
		if(!sourcePinResult.value)
		{
			return { value: false, message: `Invalid source pin info: ${sourcePinResult.message}` };
		}

		// Validate target pin
		var targetPinInfo = connectionInfo.targetPinInfo;
		var targetPinResult = circuit_utils.validateObject(targetPinInfo, ["component", "type", "index"], []);
		if(!targetPinResult.value)
		{
			return { value: false, message: `Invalid target pin info: ${targetPinResult.message}` };
		}

		// For now, only allow connecting outputs to inputs
		if(sourcePinInfo.type != circuit.PinType.OUTPUT || targetPinInfo.type != circuit.PinType.INPUT)
		{
			return { value: false, message: `Connections must go from output pin to input pin.` };
		}

		// Grab components
		var sourceComponent = sourcePinInfo.component, sourceComponentId = sourceComponent.id;
		var targetComponent = targetPinInfo.component, targetComponentId = targetComponent.id;

		// Validate input pin index
		var sourcePinType = circuit.PinType.OUTPUT, sourcePinIndex = sourcePinInfo.index, sourceInputArray = sourceComponent.outputs;
		if(sourcePinInfo.index >= sourceInputArray.length)
		{
			return { value: false, message: `Source ${sourcePinType} pin index ${sourcePinIndex} is invalid.` };
		} 

		// Validate output pin index
		var targetPinType = circuit.PinType.INPUT, targetPinIndex = targetPinInfo.index, targetInputArray = targetComponent.inputs;
		if(targetPinInfo.index >= targetInputArray.length)
		{
			return { value: false, message: `Target ${targetPinType} pin index ${targetPinIndex} is invalid.` };
		}

		// Check to ensure target input pin is not already connected
		if(this.isPinConnected(targetPinInfo))
		{
			return { value: false, message: "Input pins can only have a single connection." };
		}

		// Assign connection ID
		connectionInfo.id = this.generateConnectionId();

		// Store connection
		// NOTE: Connections are maintained across several containers for optimal lookup/traversal
		this.connections.all.push(connectionInfo);
		if(this.connections.byOutputComponent.hasOwnProperty(sourceComponentId))
		{
			this.connections.byOutputComponent[sourceComponentId].push(connectionInfo);
		}
		else
		{
			this.connections.byOutputComponent[sourceComponentId] = [ connectionInfo ];
		}
		if(this.connections.byInputComponent.hasOwnProperty(targetComponentId))
		{
			this.connections.byInputComponent[targetComponentId].push(connectionInfo);
		}
		else
		{
			this.connections.byInputComponent[targetComponentId] = [ connectionInfo ];
		}

		// Log
		var sourceLog = `${sourceComponent.descriptor.name} component (#${sourceComponent.id}) ${sourcePinType} pin ${sourcePinIndex}`;
		var targetLog = `${targetComponent.descriptor.name} component (#${targetComponent.id}) ${targetPinType} pin ${targetPinIndex}`;
		console.log(`Connection added: ${sourceLog} --> ${targetLog}`);
		return { value: true, message: "" };
	}

	// ---------------------------------------------------------------------------------------------------------------------

	removeConnections(pinInfo)
	{
		var component = pinInfo.component, componentId = component.id;
		var pinIndex = pinInfo.index, isInputPin = (pinInfo.type == circuit.PinType.INPUT);
		for(var connectionIndex = (this.connections.all.length - 1); connectionIndex >= 0 ; --connectionIndex)
		{
			var connectionInfo = this.connections.all[connectionIndex];
			var connectionPinInfo = isInputPin? connectionInfo.targetPinInfo : connectionInfo.sourcePinInfo;
			if(connectionPinInfo.component == component && connectionPinInfo.index == pinIndex)
			{
				// Remove from flat array
				this.connections.all.splice(connectionIndex, 1);

				// Grab source/target pin info
				var sourcePinInfo = connectionInfo.sourcePinInfo, targetPinInfo = connectionInfo.targetPinInfo;
				var sourceComponent = sourcePinInfo.component, targetComponent = targetPinInfo.component;
				var removeConnectionId = connectionInfo.id;

				// Remove from "output" lookup container
				var existingOutputConnections = this.connections.byOutputComponent[sourceComponent.id];
				if(existingOutputConnections != null)
				{
					existingOutputConnections = existingOutputConnections.filter(connectionInfo => (connectionInfo.id != removeConnectionId));
					this.connections.byOutputComponent[sourceComponent.id] = existingOutputConnections;
				}
				if(existingOutputConnections.length == 0)
				{
					delete this.connections.byOutputComponent[sourceComponent.id];
				}

				// Remove from "input" lookup container
				var existingInputConnections = this.connections.byInputComponent[targetComponent.id];
				if(existingInputConnections != null)
				{
					existingInputConnections = existingInputConnections.filter(connectionInfo => (connectionInfo.id != removeConnectionId));
					this.connections.byInputComponent[targetComponent.id] = existingInputConnections;
				}
				if(existingInputConnections.length == 0)
				{
					delete this.connections.byInputComponent[targetComponent.id];
				}
			}
		}
	}

	// ---------------------------------------------------------------------------------------------------------------------

	generateConnectionId()
	{
		// For now, just use a counter
		return this.nextConnectionId++;
	}

	// ---------------------------------------------------------------------------------------------------------------------
	// Misc
	isPinConnected(pinInfo)
	{
		// First check to see if the component has any connections
		var componentId = pinInfo.component.id;
		var isInputPin = (pinInfo.type == circuit.PinType.INPUT);
		var existingConnections = isInputPin? this.connections.byInputComponent[componentId] : this.connections.byOutputComponent[componentId];
		if(existingConnections == null)
		{
			return false;
		}

		// Check connections to see if this pin is already connected
		for(var existingConnectionIndex = 0; existingConnectionIndex < existingConnections.length; ++existingConnectionIndex)
		{
			var existingConnectionInfo = existingConnections[existingConnectionIndex];
			var existingPinInfo = isInputPin? existingConnectionInfo.targetPinInfo : existingConnectionInfo.sourcePinInfo;
			if(existingPinInfo.index == pinInfo.index)
			{
				return true;
			}
		}

		// Not connected
		return false
	}

	// ---------------------------------------------------------------------------------------------------------------------

	getConnections()
	{
		return this.connections.all;
	}

	// ---------------------------------------------------------------------------------------------------------------------
	// Main update
	update()
	{
		var processingQueue = [];

		// For all components...
		for(var componentIndex = 0; componentIndex < this.components.length; ++componentIndex)
		{
			var component = this.components[componentIndex];

			// Reset *all* input pins
			for(var inputPinIndex = 0; inputPinIndex < component.inputs.length; ++inputPinIndex)
			{
				component.inputs[inputPinIndex] = false;
			}

			// Adding all components with no input connections to the processing queue
			if(component.inputs.length == 0 || (this.connections.byInputComponent[component.id] == null))
			{
				processingQueue.push(component);
			}
		}

		// Start processing queue
		for(var queueIndex = 0; queueIndex < processingQueue.length; ++queueIndex)
		{
			// Update source component
			// NOTE: Input pins should already be set
			var component = processingQueue[queueIndex];
			component.update();

			// Apply source component outputs to all outgoing connections
			// NOTE: Output pins should now be set
			var outgoingConnections = this.connections.byOutputComponent[component.id];
			if(outgoingConnections != null)
			{
				for(var connectionIndex = 0; connectionIndex < outgoingConnections.length; ++connectionIndex)
				{
					var outgoingConnectionInfo = outgoingConnections[connectionIndex];
					var sourcePinInfo = outgoingConnectionInfo.sourcePinInfo;
					var targetPinInfo = outgoingConnectionInfo.targetPinInfo;
					var targetComponent = targetPinInfo.component;
					targetComponent.inputs[targetPinInfo.index] = component.outputs[sourcePinInfo.index];

					// Add target component to processing queue?
					if(!processingQueue.includes(targetComponent))
					{
						processingQueue.push(targetComponent);
					}
				}
			}

			// Add processing index (for debugging)
			if(!component.hasOwnProperty("debug"))
			{
				component.debug = { visitIndex: queueIndex };
			}
		}
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