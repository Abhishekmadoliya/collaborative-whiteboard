const Toolbar = ({ onToolSelect, onColorChange, onStrokeWidthChange }) => {
  return (
    <div className="flex gap-4 p-4 bg-white shadow-md rounded-lg">
      <button
        onClick={() => onToolSelect('pencil')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Pencil
      </button>
      <button
        onClick={() => onToolSelect('rectangle')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Rectangle
      </button>
      <button
        onClick={() => onToolSelect('circle')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Circle
      </button>
      <button
        onClick={() => onToolSelect('line')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Line
      </button>
      <input
        type="color"
        onChange={(e) => onColorChange(e.target.value)}
        className="w-10 h-10 rounded cursor-pointer"
      />
      <input
        type="range"
        min="1"
        max="20"
        defaultValue="2"
        onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
        className="w-32"
      />
    </div>
  );
};

export default Toolbar;
