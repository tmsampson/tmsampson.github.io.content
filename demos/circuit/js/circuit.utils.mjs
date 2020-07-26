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
// Misc
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
	clamp,
	loadImage
}

// -------------------------------------------------------------------------------------------------------------------------