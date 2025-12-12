import React from 'react';

export const Loader: React.FC = () => (
  <div className="flex justify-center items-center space-x-2">
    <div className="w-2 h-2 bg-catalyst-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-catalyst-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-catalyst-400 rounded-full animate-bounce"></div>
  </div>
);
