// -------------------------------------------------------------------------------------------------------------------------
// Scripts
async function loadScript(script)
{
	// Load PaperJS dynamically (cannot currently be imported as ES module)
	return new Promise(function(resolve){
		let scriptElement = document.createElement('script');
		scriptElement.src = script;
		scriptElement.onload = () => resolve(true);
		scriptElement.onerror = () => resolve(false);
		document.head.append(scriptElement);
	});
}

// -------------------------------------------------------------------------------------------------------------------------
// Validation
function validateObject(object, requiredFields, requiredFunctions)
{
	// Validate fields
	for(var i = 0; i < requiredFields.length; ++i)
	{
		var fieldName = requiredFields[i];
		if(!object.hasOwnProperty(fieldName))
		{
			return { value: false, message: `Required field '${fieldName}' was not found.`};
		}
	}

	// Validate functions
	for(var i = 0; i < requiredFunctions.length; ++i)
	{
		var functionName = requiredFunctions[i];
		if(!(typeof object[functionName] === 'function'))
		{
			return { value: false, message: `Required function '${functionName}' was not found.`};
		}
	}
	
	// Validation succeeded
	return { value: true, message: "" };
}

// -------------------------------------------------------------------------------------------------------------------------
// AABB operations
function pointInsideAABB(point, aabb)
{
	if(point.x < aabb.lowerBound.x) { return false; }
	if(point.y < aabb.lowerBound.y) { return false; }
	if(point.x > aabb.upperBound.x) { return false; }
	if(point.y > aabb.upperBound.y) { return false; }
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

function overlapAABB(aabb1, aabb2)
{
	if(aabb1.upperBound.x < aabb2.lowerBound.x) { return false; }
	if(aabb1.lowerBound.x > aabb2.upperBound.x) { return false; }
	if(aabb1.upperBound.y < aabb2.lowerBound.y) { return false; }
	if(aabb1.lowerBound.y > aabb2.upperBound.y) { return false; }
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

function expandAABBFromCentre(aabb, expansionFactor)
{
	var centre = { x: (aabb.lowerBound.x + aabb.upperBound.x) * 0.5, y: (aabb.lowerBound.y + aabb.upperBound.y) * 0.5 };
	var enlargedLowerBound = { x: centre.x + ((aabb.lowerBound.x - centre.x) * expansionFactor), y: centre.y + ((aabb.lowerBound.y - centre.y) * expansionFactor) };
	var enlargedUpperBound = { x: centre.x + ((aabb.upperBound.x - centre.x) * expansionFactor), y: centre.y + ((aabb.upperBound.y - centre.y) * expansionFactor) };
	return { lowerBound: enlargedLowerBound, upperBound: enlargedUpperBound };
}

// -------------------------------------------------------------------------------------------------------------------------

function expandAABBToContain(aabb1, aabb2)
{
	var combinedLowerBound = { x: Math.min(aabb1.lowerBound.x, aabb2.lowerBound.x), y: Math.min(aabb1.lowerBound.y, aabb2.lowerBound.y) };
	var combinedUpperBound = { x: Math.max(aabb1.upperBound.x, aabb2.upperBound.x), y: Math.max(aabb1.upperBound.y, aabb2.upperBound.y) };
	return { lowerBound: combinedLowerBound, upperBound: combinedUpperBound };
}

// -------------------------------------------------------------------------------------------------------------------------
// Maths
function clamp(x, min, max)
{
	return Math.min(Math.max(x, min), max);
}

// -------------------------------------------------------------------------------------------------------------------------
// Images
async function loadImage(imageSrc)
{
	return new Promise((resolve) => {
		let img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => resolve(null);
		img.src = imageSrc;
	});
}

// -------------------------------------------------------------------------------------------------------------------------
// Exports
export
{
	loadScript,
	validateObject,
	pointInsideAABB,
	overlapAABB,
	expandAABBFromCentre,
	expandAABBToContain,
	clamp,
	loadImage
}

// -------------------------------------------------------------------------------------------------------------------------