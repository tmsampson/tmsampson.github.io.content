// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit_render from "../../js/circuit.render.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Register
circuit_render.registerComponentWidget({
	name: "led",
	displayName: "LED",
	description: "Light Emitting Diode",
	category: "Basic",
	images:
	{
		"led_off" : { file: "led_off.svg" },
		"led_on" : { file: "led_on.svg" },
	},
	icon: { file: "led_icon.png" },
	version: "1.0.0.0",
	create: () => new LEDWidget()
});

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class LEDWidget
{
	getRenderImage(component)
	{
		var renderImage = component.inputs[0]? "led_on" : "led_off";
		return { image: renderImage, width: 90, height: 90 };
	}

	getInputPinPosition(inputPinIndex)
	{
		return { x: -2, y: 45 };
	}
}

// -------------------------------------------------------------------------------------------------------------------------