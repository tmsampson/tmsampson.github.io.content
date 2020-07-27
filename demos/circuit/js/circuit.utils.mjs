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
			return { value: false, message: `Required field '${fieldName}' was not found`};
		}
	}

	// Validate functions
	for(var i = 0; i < requiredFunctions.length; ++i)
	{
		var functionName = requiredFunctions[i];
		if(!(typeof object[functionName] === 'function'))
		{
			return { value: false, message: `Required function '${functionName}' was not found`};
		}
	}
	
	// Validation succeeded
	return { value: true, message: "" };
}

// -------------------------------------------------------------------------------------------------------------------------
// Maths
function pointInsideAABB(point, aabbBottomLeft, aabbSize)
{
	if(point.x < aabbBottomLeft.x) { return false; }
	if(point.y < aabbBottomLeft.y) { return false; }
	if(point.x > (aabbBottomLeft.x + aabbSize.x)) { return false; }
	if(point.y > (aabbBottomLeft.y + aabbSize.y)) { return false; }
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

function overlapAABB(aabbBottomLeft1, aabbSize1, aabbBottomLeft2, aabbSize2)
{
	if((aabbBottomLeft1.x + aabbSize1.x) < aabbBottomLeft2.x) { return false; }
	if(aabbBottomLeft1.x > (aabbBottomLeft2.x + aabbSize2.x)) { return false; }
	if((aabbBottomLeft1.y + aabbSize1.y) < aabbBottomLeft2.y) { return false; }
	if(aabbBottomLeft1.y > (aabbBottomLeft2.y + aabbSize2.y)) { return false; }
	return true;
}

// -------------------------------------------------------------------------------------------------------------------------

function clamp(x, min, max)
{
	return Math.min(Math.max(x, min), max);
}

// -------------------------------------------------------------------------------------------------------------------------

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
	clamp,
	loadImage
}

// -------------------------------------------------------------------------------------------------------------------------