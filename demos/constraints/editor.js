var editor =
{
	// -------------------------------------------------------------------------------------------------------------------------
	// Config
	config :
	{
		updateDelta : 16, // ms
		zoom         :
		{
			min         : 0.2,
			max         : 25.0,
			speed       : 0.15,
			inputScalar : -0.1
		}
	},

	// -------------------------------------------------------------------------------------------------------------------------
	// Constants
	constants :
	{
		tau             : (2 * Math.PI),
		mouse_btn_right : 2
	},

	// -------------------------------------------------------------------------------------------------------------------------
	// Canvas
	canvas :
	{
		container   : null,
		element     : null,
		drawContext : null
	},

	// -------------------------------------------------------------------------------------------------------------------------
	// View
	view :
	{
		focus      : { x: 0, y: 0 },
		zoom       : 1.0,
		zoomTarget : 1.0,
		panning    :
		{
			isActive : false,
			origin   : { x: 0, y: 0 },
		}
	},

	// -------------------------------------------------------------------------------------------------------------------------
	// Cursor
	cursor :
	{
		positionView   : { x: 0, y: 0 },
		positionCanvas : { x: 0, y: 0 },
	},

	// -------------------------------------------------------------------------------------------------------------------------
	// App
	app :
	{
		name           : "{APP_NAME}",
		initCallback   : null,
		updateCallback : null,
		renderCallback : null
	},

	// -------------------------------------------------------------------------------------------------------------------------

	init : function(name, initCallback, updateCallback, renderCallback)
	{
		// Store app info
		editor.app.name = name;
		editor.app.initCallback = initCallback;
		editor.app.updateCallback = updateCallback;
		editor.app.renderCallback = renderCallback;

		// Setup toolbox
		var toolbox = $("#editor_toolbox");
		toolbox.dialog({ width: 200, closeOnEscape: false, dialogClass: "noclose" });
		$("div[aria-describedby='editor_toolbox']").offset({ top: 20, left: 20 });

		// Setup canvas container
		editor.canvas.container = $("#editor_canvas_container");
		editor.resizeCanvasContainer();

		// Create canvas
		var canvasElement = $("<canvas id='editor_canvas' resize></canvas>");

		// Bind canvas events
		canvasElement.on("mousedown", (e) => editor.onMouseDown(e));
		canvasElement.on("mouseup", (e) => editor.onMouseUp(e));
		canvasElement.on("mousemove", (e) => editor.onMouseMove(e));
		canvasElement.on("wheel", (e) => editor.onMouseWheel(e));

		// Store canvas and draw context
		editor.canvas.element = canvasElement[0];
		editor.canvas.drawContext = editor.canvas.element.getContext("2d");

		// Add canvas to container
		editor.canvas.container.append(editor.canvas.element);

		// Make sure canvas container resizes with screen
		$(window).resize(() => editor.resizeCanvasContainer());

		// Init app
		editor.app.initCallback();

		// Start game loop
		var previousTimestamp, firstFrame = true;
		var renderLoop = (timestamp) =>
		{
			// Calculate dt
			if(firstFrame) { previousTimestamp = timestamp };
			var deltaMs = (timestamp - previousTimestamp);
			var deltaS = deltaMs / 1000;
			previousTimestamp = timestamp;

			// Update and render
			editor.update(deltaS);
			editor.render(deltaS);

			// Request next frame
			firstFrame = false;
			window.requestAnimationFrame(renderLoop);
		};
		window.requestAnimationFrame(renderLoop);
	},

	// -------------------------------------------------------------------------------------------------------------------------

	update : function(deltaS)
	{
		// Update view
		editor.resizeCanvas();
		editor.view.zoom = (editor.view.zoomTarget * editor.config.zoom.speed) + (editor.view.zoom * (1.0 -  editor.config.zoom.speed));

		// Update app
		editor.app.updateCallback(deltaS);
	},

	// ---------------------------------------------------------------------------------------------------------------------

	render : function(deltaS)
	{
		// Render app
		editor.app.renderCallback(editor.canvas.drawContext, editor.canvas.element.width, editor.canvas.element.height, deltaS);
	},

	// ---------------------------------------------------------------------------------------------------------------------

	onMouseDown : function(e)
	{
		if(e.which == editor.constants.mouse_btn_right) { editor.panningBegin(e.pageX, e.pageY); }
	},

	// ---------------------------------------------------------------------------------------------------------------------

	onMouseUp : function(e)
	{
		if(e.which == editor.constants.mouse_btn_right) { editor.panningEnd(e.pageX, e.pageY); }
	},

	// ---------------------------------------------------------------------------------------------------------------------

	onMouseMove : function(e)
	{
		editor.cursor.positionView = { x: e.pageX, y: e.pageY };
		editor.cursor.positionCanvas = editor.viewToWorld(editor.cursor.positionView);
		if(editor.view.panning.isActive)
		{
			editor.panningUpdate(e.pageX, e.pageY);
		}
	},

	// ---------------------------------------------------------------------------------------------------------------------

	onMouseWheel : function(e)
	{
		var zoomAmount = e.originalEvent.deltaY * editor.config.zoom.inputScalar;
		editor.view.zoomTarget = editor.util.clamp(editor.view.zoomTarget * (1 + zoomAmount), editor.config.zoom.min, editor.config.zoom.max);
	},

	// ---------------------------------------------------------------------------------------------------------------------

	panningBegin : function(x, y)
	{
		editor.view.panning.isActive = true;
		editor.view.panning.origin = { x: x, y: y };
		editor.canvas.element.style.cursor = "move";
	},

	// ---------------------------------------------------------------------------------------------------------------------

	panningUpdate : function(x, y)
	{
		// Apply pan offset to view
		var delta = { x: x - editor.view.panning.origin.x, y: y - editor.view.panning.origin.y };
		editor.view.focus.x += delta.x * (1 / editor.view.zoom );
		editor.view.focus.y += delta.y * (1 / editor.view.zoom );

		// Update pan origin
		editor.view.panning.origin.x = x;
		editor.view.panning.origin.y = y;
	},

	// ---------------------------------------------------------------------------------------------------------------------

	panningEnd : function()
	{
		editor.view.panning.isActive = false;
		editor.canvas.element.style.cursor = "default";
	},
	// ---------------------------------------------------------------------------------------------------------------------

	worldToView : function(worldPosition)
	{
		var canvasCentre = { x: editor.canvas.element.width * 0.5, y: editor.canvas.element.height * 0.5 };
		var canvasX = canvasCentre.x + (worldPosition.x + editor.view.focus.x) * editor.view.zoom;
		var canvasY = canvasCentre.y + (-worldPosition.y + editor.view.focus.y) * editor.view.zoom;
		return { x: canvasX, y: canvasY };
	},

	// -------------------------------------------------------------------------------------------------------------------------

	viewToWorld : function(canvasPosition)
	{
		var canvasCentre = { x: editor.canvas.element.width * 0.5, y: editor.canvas.element.height * 0.5 };
		var worldX = ((canvasPosition.x - canvasCentre.x) / editor.view.zoom) - editor.view.focus.x;
		var worldY = -((canvasPosition.y - canvasCentre.y) / editor.view.zoom) - editor.view.focus.y;
		return { x: worldX, y: worldY };
	},

	// -------------------------------------------------------------------------------------------------------------------------

	resizeCanvasContainer : function()
	{
		editor.canvas.container.css("width", window.innerWidth);
		editor.canvas.container.css("height", window.innerHeight);
	},

	// -------------------------------------------------------------------------------------------------------------------------

	resizeCanvas : function()
	{
		editor.canvas.element.width = editor.canvas.container.width();
		editor.canvas.element.height = editor.canvas.container.height();
	},

	// -------------------------------------------------------------------------------------------------------------------------

	drawCircle : function(ctx, position, radius, fillColour, lineColour, lineThickness)
	{
		var viewPos = editor.worldToView(position);
		ctx.fillStyle = fillColour; ctx.strokeStyle = lineColour; ctx.lineWidth = lineThickness;
		ctx.beginPath();
		ctx.arc(viewPos.x, viewPos.y, radius * editor.view.zoom, 0.0, editor.constants.tau);
		ctx.fill(); ctx.stroke();
	},

	// -------------------------------------------------------------------------------------------------------------------------

	drawLine : function(ctx, start, end, lineColour, lineThickness)
	{
		var startView = editor.worldToView(start), endView = editor.worldToView(end);
		ctx.strokeStyle = lineColour; ctx.lineWidth = lineThickness;
		ctx.beginPath();
		ctx.moveTo(startView.x, startView.y);
		ctx.lineTo(endView.x, endView.y);
		ctx.stroke();
	},

	// -------------------------------------------------------------------------------------------------------------------------
	// Utils
	util :
	{
		min : function(x, y)
		{
			return Math.min(x, y);
		},

		max : function(x, y)
		{
			return Math.max(x, y);
		},

		clamp : function(x, min, max)
		{
			return Math.min(Math.max(x, min), max);
		}
	}
};

// -------------------------------------------------------------------------------------------------------------------------
// Vector math
var vec3 =
{
	zero    : { x: 0, y: 0, z: 0 },
	right   : { x: 1, y: 0, z: 0 },
	up      : { x: 0, y: 1, z: 0 },
	forward : { x: 0, y: 0, z: 1 },

	add : function(v0, v1)
	{
		return { x: v0.x + v1.x, y: v0.y + v1.y, z: v0.z + v1.z };
	},

	subtract : function(v0, v1)
	{
		return { x: v0.x - v1.x, y: v0.y - v1.y, z: v0.z - v1.z };
	},
	
	multiply : function(v0, v1)
	{
		return { x: v0.x * v1.x, y: v0.y * v1.y, z: v0.z * v1.z };
	},
	
	multiplyScalar : function(v0, s)
	{
		return { x: v0.x * s, y: v0.y * s, z: v0.z * s };
	},
	
	length: function(v0)
	{
		return Math.sqrt((v0.x * v0.x) + (v0.y * v0.y) + (v0.z * v0.z));
	},

	normalise : function(v0)
	{
		var length = vec3.length(v0);
		return { x: v0.x / length, y: v0.y / length, z: v0.z / length };
	},

	dot : function(v0, v1)
	{
		return (v0.x * v1.x) + (v0.y * v1.y) + (v0.z * v1.z);
	},

	cross : function(v0, v1)
	{
		var x = (v0.y * v1.z) - (v0.z * v1.y);
		var y = (v0.z * v1.x) - (v0.x * v1.z);
		var z = (v0.x * v1.y) - (v0.y * v1.x);
		return { x: x, y: y, z: z };
	},

	reflect : function(v0, v1)
	{
		var normal = vec3.normalise(v1);
		var x = vec3.multiplyScalar(normal, 2.0 * vec3.dot(normal, v0));
		return vec3.subtract(v0, x);
	}
};

// -------------------------------------------------------------------------------------------------------------------------