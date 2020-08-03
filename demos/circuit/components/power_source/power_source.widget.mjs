// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit_render from "../../js/circuit.render.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Register
circuit_render.registerComponentWidget({
	name: "power_source",
	displayName: "Power Source",
	description: "'Always On' Power source",
	category: "Basic",
	images:
	{
		"power_source" : { file: "power_source.svg" },
	},
	icon: { file: "power_source_icon.png" },
	version: "1.0.0.0",
	create: () => new PowerSourceWidget()
});

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class PowerSourceWidget
{
	getRenderImage(component)
	{
		return { image: "power_source", width: 60, height: 60 };
	}

	getOutputPinPosition(outputPinIndex)
	{
		return { x: 63, y: 30 };
	}
}

// -------------------------------------------------------------------------------------------------------------------------