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
	imageIcon: "power_source_icon.png",
	version: "1.0.0.0",
	create: () => new PowerSourceRenderer()
});

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class PowerSourceRenderer
{
	constructor()
	{
		
	}
}

// -------------------------------------------------------------------------------------------------------------------------