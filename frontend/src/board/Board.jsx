import React from 'react'
import Canvas from '../components/Canvas'
import TextEditor from '../components/TextEditor'

const Board = () => {
  return (
    <div className='flex  flex-row-reverse min-h-screen  '>
        <div className='w-[50%]'>

      <Canvas />
        </div>
        <div className='w-[50%]'>
            <TextEditor />
        </div>
      {/* <p className="text-center text-gray-600 mt-4">Collaborative Whiteboard</p> */}
    </div>
  )
}

export default Board
