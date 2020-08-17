// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit_render from "../../js/circuit.render.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Register
circuit_render.registerComponentWidget({
	name: "switch_spst",
	displayName: "Switch (SPST)",
	description: "Single Pole Single Throw Switch",
	category: "Switches",
	images:
	{
		"switch_open" : { file: "switch_spst_open.svg" },
		"switch_closed" : { file: "switch_spst_closed.svg" },
	},
	icon: { file: "switch_spst_icon.png" },
	version: "1.0.0.0",
	create: () => new SwitchSPSTWidget()
});

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class SwitchSPSTWidget
{
	getRenderImage(component)
	{
		var renderImage = component.isOpen()? "switch_open" : "switch_closed";
		return { image: renderImage, width: 90, height: 90 };
	}

	getInputPinPosition(inputPinIndex)
	{
		return { x: 13.78, y: 45.3 };
	}

	getOutputPinPosition(outputPinIndex)
	{
		return { x: 76.22, y: 45.3 };
	}

	onClick(component)
	{
		component.toggleState();
	}
}

// -------------------------------------------------------------------------------------------------------------------------