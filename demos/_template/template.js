// -------------------------------------------------------------------------------------------------------------------------
// Entry point
window.onload = function()
{
	editor.init("template app", onInit, onUpdate, onRender);
};

// -------------------------------------------------------------------------------------------------------------------------
// Init
function onInit()
{

}

// -------------------------------------------------------------------------------------------------------------------------
// Update
function onUpdate(deltaS)
{

}

// -------------------------------------------------------------------------------------------------------------------------
// Render
function onRender(ctx, canvasWidth, canvasHeight, deltaS)
{
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	editor.drawCircle(ctx, { x: 0, y: 0 }, 20, "#ffAA00", "#555555", 1);
}

// -------------------------------------------------------------------------------------------------------------------------