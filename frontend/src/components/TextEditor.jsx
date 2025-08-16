import React from 'react'

const TextEditor = () => {
  return (
    <div className=" w-[500px] h-[600px] p-4 bg-white shadow-md rounded-lg">
      <textarea style={{ width: '100%', height: '100%' }} />
      <button>Save</button>
    </div>
  )
}

export default TextEditor
