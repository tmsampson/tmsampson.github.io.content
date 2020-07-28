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
	images:
	{
		"nand" : { file: "nand.svg" },
	},
	icon: { file: "nand_icon.png" },
	version: "1.0.0.0",
	create: () => new NandWidget()
});

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class NandWidget
{
	getRenderImage(component)
	{
		return { image: "nand", width: 54, height: 40 };
	}
}

// -------------------------------------------------------------------------------------------------------------------------