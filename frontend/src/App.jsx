import { useEffect } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import useBoardStore from './store/boardStore';

function App() {
  const {
    setCurrentTool,
    setCurrentColor,
    setStrokeWidth,
  } = useBoardStore();

  useEffect(() => {
    // Generate a random room ID if not in URL
    const roomId = window.location.pathname.split('/')[1] || Math.random().toString(36).substring(2, 9);
    if (!window.location.pathname.includes(roomId)) {
      window.history.pushState({}, '', `/${roomId}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">Collaborative Whiteboard</h1>
        <Toolbar
          onToolSelect={setCurrentTool}
          onColorChange={setCurrentColor}
          onStrokeWidthChange={setStrokeWidth}
        />
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <Canvas />
        </div>
      </div>
    </div>
  );
}

export default App;
