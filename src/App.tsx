// src/App.tsx
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import MouthShader from './components/MouthShader';
import './App.css';

function App() {
    const [start, setStart] = useState(false);

    const handleStart = () => {
        setStart(true);
    };

    return (
        <div className="App">
            {!start && (
                <div className="overlay">
                    <button className="start-button" onClick={handleStart}>
                        Enter the Realm
                    </button>
                </div>
            )}
            {start && (
                <Canvas>
                    <MouthShader />
                </Canvas>
            )}
        </div>
    );
}

export default App;
