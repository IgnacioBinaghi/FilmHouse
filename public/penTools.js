document.addEventListener("DOMContentLoaded", () => {
  const drawingCanvas = document.getElementById("drawingCanvas");
  const ctx = drawingCanvas.getContext("2d");
  let isDrawing = false;
  let drawingEnabled = false; // Keep track of the drawing mode

  // Function to resize canvas to match video size
  function resizeCanvas() {
    drawingCanvas.width = drawingCanvas.offsetWidth;
    drawingCanvas.height = drawingCanvas.offsetHeight;
  }
  resizeCanvas(); // Initial resize
  // Consider adding event listener for window resize if needed

  function toggleDrawingMode() {
    drawingEnabled = !drawingEnabled;
    drawingCanvas.style.pointerEvents = drawingEnabled ? "auto" : "none";
  }

  document
    .getElementById("toggleDrawingMode")
    .addEventListener("click", toggleDrawingMode);

  drawingCanvas.addEventListener("mousedown", (e) => {
    if (!drawingEnabled) return;
    isDrawing = true;
    ctx.beginPath();
    const rect = drawingCanvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  });

  drawingCanvas.addEventListener("mousemove", (e) => {
    if (!drawingEnabled || !isDrawing) return;
    ctx.strokeStyle = "#FF0000"; // Pen color
    ctx.lineWidth = 3; // Pen width
    const rect = drawingCanvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  });

  window.addEventListener("mouseup", () => {
    if (isDrawing) {
      ctx.closePath();
      isDrawing = false;
    }
  });

  document.getElementById("clearCanvasBtn").addEventListener("click", () => {
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  });
});
