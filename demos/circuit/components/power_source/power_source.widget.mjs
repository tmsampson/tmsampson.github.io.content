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
	image: { file: "power_source.svg", width: 60, height: 60 },
	imageIcon: { file: "power_source_icon.png" },
	version: "1.0.0.0",
	create: () => new PowerSourceWidget()
});

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class PowerSourceWidget
{
	constructor()
	{
		
	}
}

// -------------------------------------------------------------------------------------------------------------------------