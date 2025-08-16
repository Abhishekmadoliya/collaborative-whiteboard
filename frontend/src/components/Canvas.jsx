import React, { useRef, useState, useEffect } from "react";

export default function Canvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // drawing state
  const [tool, setTool] = useState("pencil"); // pencil | rect | circle | text | eraser
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [fillShape, setFillShape] = useState(false);
  const [textValue, setTextValue] = useState("Hello");
  const [canvasSize] = useState({ width: 1000, height: 600 });

  // pointer / drawing helpers
  const isDrawingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef(null); // ImageData for shape preview / restore

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    // initial background (white)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [canvasSize]);

  // update ctx stroke/fill when options change (used when drawing)
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.strokeStyle = brushColor;
    ctx.fillStyle = brushColor;
    ctx.lineWidth = brushSize;
  }, [brushColor, brushSize]);

  function getPointerPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    return { x, y };
  }

  function handlePointerDown(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(e.pointerId);
    const pos = getPointerPos(e);

    const ctx = ctxRef.current;
    if (!ctx) return;

    // pencil or eraser: begin path
    if (tool === "pencil" || tool === "eraser") {
      isDrawingRef.current = true;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }
    }

    // text: place immediately
    if (tool === "text") {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = brushColor;
      // adjust font size relative to brushSize
      const fontSize = Math.max(10, brushSize * 6);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillText(textValue, pos.x, pos.y);
      ctx.restore();
    }

    // shapes: save a snapshot for preview and remember start point
    if (tool === "rect" || tool === "circle") {
      try {
        snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (err) {
        // If canvas is tainted this will fail; still continue without preview
        snapshotRef.current = null;
      }
      startRef.current = pos;
      isDrawingRef.current = true;
    }
  }

  function handlePointerMove(e) {
    if (!isDrawingRef.current) return;
    const pos = getPointerPos(e);
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (tool === "pencil" || tool === "eraser") {
      // continue line
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      return;
    }

    if (tool === "rect") {
      // restore snapshot for live preview
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      // compute rectangle coords from start to current
      const sx = startRef.current.x;
      const sy = startRef.current.y;
      const w = pos.x - sx;
      const h = pos.y - sy;
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = brushColor;
      ctx.fillStyle = brushColor;
      if (fillShape) ctx.fillRect(sx, sy, w, h);
      else ctx.strokeRect(sx, sy, w, h);
      ctx.restore();
      return;
    }

    if (tool === "circle") {
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      const sx = startRef.current.x;
      const sy = startRef.current.y;
      const dx = pos.x - sx;
      const dy = pos.y - sy;
      const radius = Math.sqrt(dx * dx + dy * dy);
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = brushColor;
      ctx.fillStyle = brushColor;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.closePath();
      if (fillShape) ctx.fill();
      else ctx.stroke();
      ctx.restore();
      return;
    }
  }

  function handlePointerUp(e) {
    const canvas = canvasRef.current;
    canvas.releasePointerCapture?.(e.pointerId);
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (!isDrawingRef.current) return;
    const pos = getPointerPos(e);

    if (tool === "pencil" || tool === "eraser") {
      ctx.closePath();
      // reset composite mode to default
      ctx.globalCompositeOperation = "source-over";
    }

    // finalize shapes (if snapshot exists we already painted on canvas during move; if no move done, draw once)
    if ((tool === "rect" || tool === "circle") && isDrawingRef.current) {
      // If we never moved (very small drag), still draw small shape:
      if (snapshotRef.current) {
        // snapshot already restored during last move; we can just leave it as already drawn
        snapshotRef.current = null;
      } else {
        // draw final from start to pos (no preview)
        const sx = startRef.current.x;
        const sy = startRef.current.y;
        if (tool === "rect") {
          const w = pos.x - sx;
          const h = pos.y - sy;
          if (fillShape) ctx.fillRect(sx, sy, w, h);
          else ctx.strokeRect(sx, sy, w, h);
        } else {
          const dx = pos.x - sx;
          const dy = pos.y - sy;
          const radius = Math.sqrt(dx * dx + dy * dy);
          ctx.beginPath();
          ctx.arc(sx, sy, radius, 0, Math.PI * 2);
          ctx.closePath();
          if (fillShape) ctx.fill();
          else ctx.stroke();
        }
      }
    }

    isDrawingRef.current = false;
  }

  // clear canvas (resets to white background)
  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function downloadCanvas() {
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvasRef.current.toDataURL();
    link.click();
  }

  return (
    <div style={{  fontFamily: "sans-serif"}} >
      <div style={{ marginBottom: 2, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <button onClick={() => setTool("pencil")} style={tool === "pencil" ? selectedBtn : btn}>✏️ Pencil</button>
          <button onClick={() => setTool("rect")} style={tool === "rect" ? selectedBtn : btn}>⬛ Rectangle</button>
          <button onClick={() => setTool("circle")} style={tool === "circle" ? selectedBtn : btn}>⚪ Circle</button>
          <button onClick={() => setTool("text")} style={tool === "text" ? selectedBtn : btn}>📝 Text</button>
          <button onClick={() => setTool("eraser")} style={tool === "eraser" ? selectedBtn : btn}>🧽 Eraser</button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label>Color</label>
          <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label>Size</label>
          <input
            type="range"
            min={1}
            max={60}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
          <span style={{ width: 36, textAlign: "right" }}>{brushSize}px</span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label><input type="checkbox" checked={fillShape} onChange={(e) => setFillShape(e.target.checked)} /> Fill shapes</label>
        </div>

        {tool === "text" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Text to place" />
            <small style={{ color: "#666" }}>Click on canvas to place text</small>
          </div>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={clearCanvas} style={btn}>🗑 Clear</button>
          <button onClick={downloadCanvas} style={btn}>⬇ Download</button>
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", display: "inline-block", width: "100%" }}>
        <canvas
          ref={canvasRef}
          style={{ touchAction: "none", display: "block", background: "#fff", overflow: "hidden" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    </div>
  );
}

// simple inline button styles
const btn = {
  padding: "6px 10px",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  borderRadius: 6,
};
const selectedBtn = {
  ...btn,
  background: "#2563eb",
  color: "#fff",
  borderColor: "#2563eb",
};
