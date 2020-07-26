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
	image: { file: "nand.svg", width: 100, height: 50 },
	imageIcon: { file: "nand_icon.png" },
	version: "1.0.0.0",
	create: () => new NandWidget()
});

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class NandWidget
{
	constructor()
	{
		
	}
}

// -------------------------------------------------------------------------------------------------------------------------