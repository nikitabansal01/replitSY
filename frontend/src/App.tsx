import React from "react";
import "./index.css";

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-purple-600 mb-4">Winnie</h1>
        <p className="text-lg text-gray-600 mb-4">Your AI Health Coach</p>
        <div className="bg-purple-100 p-4 rounded">
          <p className="text-sm text-purple-800">
            If you can see this styled content, React and Tailwind are working correctly!
          </p>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <p>Build timestamp: {new Date().toISOString()}</p>
          <p>Environment: {import.meta.env.MODE}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
