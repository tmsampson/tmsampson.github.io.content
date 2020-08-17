// -------------------------------------------------------------------------------------------------------------------------
// Import
import * as circuit from "../../js/circuit.mjs";

// -------------------------------------------------------------------------------------------------------------------------
// Register
circuit.registerComponent({
	name: "switch_spst",
	version: "1.0.0.0",
	create: () => new SwitchSPST()
});

// -------------------------------------------------------------------------------------------------------------------------
// Enums
const SwitchState =
{
	OPEN: "open",
	CLOSED: "closed",
};

// -------------------------------------------------------------------------------------------------------------------------
// Implementation
class SwitchSPST
{
	constructor()
	{
		this.state = SwitchState.CLOSED;
		this.inputs = [ false ];
		this.outputs = [ false ];
	}

	update()
	{
		this.outputs[0] = this.isOpen()? false : this.inputs[0];
	}

	isOpen()
	{
		return (this.state == SwitchState.OPEN);
	}

	toggleState()
	{
		this.state = this.isOpen()? SwitchState.CLOSED : SwitchState.OPEN;
	}
}

// -------------------------------------------------------------------------------------------------------------------------