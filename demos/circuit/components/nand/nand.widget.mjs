// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit_render from "../../js/circuit.render.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Register
circuit_render.registerComponentWidget({
	name: "nand",
	displayName: "NAND",
	description: "Nand gate",
	category: "Basic",
	imageIcon: "nand_icon.png",
	imageDisplay: "nand_display.png",
	version: "1.0.0.0",
	create: () => new NandRenderer()
});

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class NandRenderer
{
	constructor()
	{
		
	}
}

// -------------------------------------------------------------------------------------------------------------------------