// -------------------------------------------------------------------------------------------------------------------------
// Init
circuit.components = { };

// -------------------------------------------------------------------------------------------------------------------------
// Factory | Init
circuit.components.factory = { createFuncs: { } };

// -------------------------------------------------------------------------------------------------------------------------
// Factory | Registration
circuit.components.factory.register = function(name, createFunc)
{
	circuit.components.factory.createFuncs[name] = createFunc;
	console.log("Registering component: " + name);
};