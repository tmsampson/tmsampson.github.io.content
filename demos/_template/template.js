// -------------------------------------------------------------------------------------------------------------------------
// Entry point
window.onload = function()
{
	editor.init("template app", onUpdate, onRender);
};

// -------------------------------------------------------------------------------------------------------------------------
// Update
function onUpdate(deltaS)
{
	console.log("deltaS = " + deltaS);
}

// -------------------------------------------------------------------------------------------------------------------------
// Render
function onRender(ctx, canvasWidth, canvasHeight, deltaS)
{
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	var canvasPos = editor.worldToView({ x: 0, y: 0 });
	ctx.fillStyle = "#ffff00"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.arc(canvasPos.x, canvasPos.y, 20 * editor.view.zoom, 0.0, editor.constants.tau);
	ctx.fill(); ctx.stroke();
}

// -------------------------------------------------------------------------------------------------------------------------