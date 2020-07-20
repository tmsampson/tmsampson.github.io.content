// -------------------------------------------------------------------------------------------------------------------------
// Registration
circuit.components.nand = {	name: "nand" };
circuit.components.factory.register(circuit.components.nand.name, circuit.components.nand.create);

// -------------------------------------------------------------------------------------------------------------------------
// Create per-instance data
circuit.components.nand.create = function()
{
	return { inputs: [ false, false ], outputs: [false] };
}

// -------------------------------------------------------------------------------------------------------------------------