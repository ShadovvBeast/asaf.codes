import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import Experience from './components/Experience';
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
                <Canvas camera={{ position: [0, 1.5, 3], fov: 45 }}>
                    {/* Enhanced Lighting */}
                    <ambientLight intensity={0} />
                    <pointLight position={[-5, 5, 5]} intensity={0} />
                    <spotLight position={[5, 5, 5]} intensity={0} angle={0.3} penumbra={1} />

                    <Environment preset="sunset" />

                    {/* Scene components */}
                    <Experience />

                    <EffectComposer>
                        <Bloom intensity={0.1} luminanceThreshold={0.2} />
                        <Vignette eskil={false} offset={0.1} darkness={1.4} />
                    </EffectComposer>

                    <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2} />
                </Canvas>
            )}
        </div>
    );
}

export default App;
