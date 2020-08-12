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
		return { image: "nand", width: 77.22, height: 57.2 };
	}

	getInputPinPosition(inputPinIndex)
	{
		switch(inputPinIndex)
		{
			case 0: return { x: 0, y: 14.79 };
			case 1: return { x: 0, y: 42.41 };
		}
	}

	getOutputPinPosition(outputPinIndex)
	{
		return { x: 81.22, y: 28.6 };
	}
}

// -------------------------------------------------------------------------------------------------------------------------