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

	getInputPinPosition(inputPinIndex)
	{
		switch(inputPinIndex)
		{
			case 0: return { x: 0, y: 10.35 };
			case 1: return { x: 0, y: 29.65 };
		}
	}

	getOutputPinPosition(outputPinIndex)
	{
		return { x: 56.8, y: 20 };
	}
}

// -------------------------------------------------------------------------------------------------------------------------