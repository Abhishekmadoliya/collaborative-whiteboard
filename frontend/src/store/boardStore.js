import { create } from 'zustand';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

const useBoardStore = create((set) => ({
  shapes: [],
  currentTool: 'pencil',
  currentColor: '#000000',
  strokeWidth: 2,
  isDrawing: false,
  otherCursors: {},

  setCurrentTool: (tool) => set({ currentTool: tool }),
  setCurrentColor: (color) => set({ currentColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),

  addShape: (shape) => {
    set((state) => ({ shapes: [...state.shapes, shape] }));
    socket.emit('draw', shape);
  },

  updateShapes: (shapes) => set({ shapes }),

  updateOtherCursors: (cursorData) => set((state) => ({
    otherCursors: {
      ...state.otherCursors,
      [cursorData.userId]: cursorData
    }
  })),

  removeOtherCursor: (userId) => set((state) => {
    const newCursors = { ...state.otherCursors };
    delete newCursors[userId];
    return { otherCursors: newCursors };
  }),

  // Socket event handlers
  initializeSocket: () => {
    socket.on('initialShapes', (shapes) => {
      set({ shapes });
    });

    socket.on('draw', (shape) => {
      set((state) => ({ shapes: [...state.shapes, shape] }));
    });

    socket.on('cursorMove', (cursorData) => {
      set((state) => ({
        otherCursors: {
          ...state.otherCursors,
          [cursorData.userId]: cursorData
        }
      }));
    });

    socket.on('userDisconnected', (userId) => {
      set((state) => {
        const newCursors = { ...state.otherCursors };
        delete newCursors[userId];
        return { otherCursors: newCursors };
      });
    });
  }
}));

export default useBoardStore;
