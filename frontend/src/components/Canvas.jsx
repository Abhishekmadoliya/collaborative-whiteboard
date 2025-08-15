import { useEffect, useRef } from 'react';
import useBoardStore from '../store/boardStore';

const Canvas = () => {
  const canvasRef = useRef(null);
  const {
    shapes,
    currentTool,
    currentColor,
    strokeWidth,
    isDrawing,
    setIsDrawing,
    addShape,
    otherCursors,
    initializeSocket
  } = useBoardStore();

  useEffect(() => {
    initializeSocket();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear and redraw all shapes
    const redrawCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      shapes.forEach(shape => drawShape(ctx, shape));
      
      // Draw other users' cursors
      Object.values(otherCursors).forEach(cursor => {
        ctx.beginPath();
        ctx.fillStyle = cursor.color || 'red';
        ctx.arc(cursor.x, cursor.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    redrawCanvas();
  }, [shapes, otherCursors]);

  const drawShape = (ctx, shape) => {
    if (!shape || !shape.type || !shape.color) return;

    ctx.beginPath();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.strokeWidth || 2;

    try {
      switch (shape.type) {
        case 'pencil': {
          if (!shape.points || shape.points.length < 1) return;
          const points = shape.points;
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            const point = points[i];
            if (point && typeof point.x === 'number' && typeof point.y === 'number') {
              ctx.lineTo(point.x, point.y);
              ctx.stroke(); // Stroke each line segment for pencil
              ctx.beginPath();
              ctx.moveTo(point.x, point.y);
            }
          }
          break;
        }
        case 'rectangle': {
          if (typeof shape.x !== 'number' || typeof shape.y !== 'number' ||
              typeof shape.width !== 'number' || typeof shape.height !== 'number') return;
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
          break;
        }
        case 'circle': {
          if (typeof shape.x !== 'number' || typeof shape.y !== 'number' ||
              typeof shape.radius !== 'number') return;
          ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'line': {
          if (typeof shape.startX !== 'number' || typeof shape.startY !== 'number' ||
              typeof shape.endX !== 'number' || typeof shape.endY !== 'number') return;
          ctx.moveTo(shape.startX, shape.startY);
          ctx.lineTo(shape.endX, shape.endY);
          ctx.stroke();
          break;
        }
      }
    } catch (error) {
      console.error('Error drawing shape:', error);
    }
  };

  let currentShape = null;
  let startPoint = null;

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    startPoint = { x, y };

    switch (currentTool) {
      case 'pencil':
        currentShape = {
          type: 'pencil',
          points: [{ x, y }],
          color: currentColor,
          strokeWidth
        };
        break;
      case 'rectangle':
      case 'circle':
      case 'line':
        currentShape = {
          type: currentTool,
          x,
          y,
          color: currentColor,
          strokeWidth
        };
        break;
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentShape || !startPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    try {
      let shouldRedraw = false;

      switch (currentTool) {
        case 'pencil': {
          if (!currentShape.points) currentShape.points = [];
          currentShape.points.push({ x, y });
          shouldRedraw = true;
          break;
        }
        case 'rectangle': {
          const width = x - startPoint.x;
          const height = y - startPoint.y;
          if (currentShape.width !== width || currentShape.height !== height) {
            currentShape.width = width;
            currentShape.height = height;
            shouldRedraw = true;
          }
          break;
        }
        case 'circle': {
          const dx = x - startPoint.x;
          const dy = y - startPoint.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          if (currentShape.radius !== radius) {
            currentShape.radius = radius;
            shouldRedraw = true;
          }
          break;
        }
        case 'line': {
          if (currentShape.endX !== x || currentShape.endY !== y) {
            currentShape.startX = startPoint.x;
            currentShape.startY = startPoint.y;
            currentShape.endX = x;
            currentShape.endY = y;
            shouldRedraw = true;
          }
          break;
        }
      }

      if (shouldRedraw) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (Array.isArray(shapes)) {
          shapes.forEach(shape => drawShape(ctx, shape));
        }
        drawShape(ctx, currentShape);
      }
    } catch (error) {
      console.error('Error in mouse move:', error);
      setIsDrawing(false);
      currentShape = null;
      startPoint = null;
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    addShape(currentShape);
    currentShape = null;
    startPoint = null;
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="border border-gray-300 rounded-lg"
    />
  );
};

export default Canvas;
