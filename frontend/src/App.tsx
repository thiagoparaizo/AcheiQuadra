import React from 'react';

import Button from './components/common/Button';

function App() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">QuadrasApp</h1>
      <div className="space-x-2">
        <Button variant="primary">Botão Primário</Button>
        <Button variant="secondary">Botão Secundário</Button>
        <Button variant="outline">Botão Outline</Button>
      </div>
    </div>
  );
}

export default App;
