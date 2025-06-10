import React from 'react'

function LoadingSpinner() {
  return (
    <div className="flex justify-center">
      <div className="w-10 h-10 border-4 border-green-500 border-dashed rounded-full animate-spin"></div>
    </div>
  )
}

export default LoadingSpinner