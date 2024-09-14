// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import MouthShader from './components/MouthShader';
import { initializeLLM, generateText } from './utils/TextGenerator';
import { initializeMeSpeak } from './utils/mespeakLoader';
import meSpeak from 'mespeak';
import './App.css';

function App() {
    const [start, setStart] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState({});
    const [audioAnalyzer, setAudioAnalyzer] = useState<AnalyserNode | null>(null);

    useEffect(() => {
        const loadResources = async () => {
            try {
                // Initialize meSpeak
                await initializeMeSpeak();

                // Initialize LLM with progress callback
                await initializeLLM((progress) => {
                    // Update loading progress
                    setLoadingProgress(progress);
                });

                // Loading complete
                setLoading(false);
            } catch (error) {
                console.error('Initialization error:', error);
            }
        };

        loadResources();
    }, []);

    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [words, setWords] = useState<string[]>([]);

    const handleStart = async () => {
        setStart(true);

        // Generate text and audio
        const text = await generateText('Greetings great one, what can you reveal about what lies ahead?');

        // Split text into words and store in state
        const wordsArray = text.split(' ');
        setWords(wordsArray);

        const options = {
            amplitude: 100,
            wordgap: 0,
            pitch: 30,
            speed: 80,
            variant: 'm3',
            rawdata: 'ArrayBuffer',
        };

        // Generate audio data
        const audioData = meSpeak.speak(text, options) as ArrayBuffer;

        if (audioData && audioData.byteLength > 0) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            audioContext.decodeAudioData(
                audioData,
                (decodedData) => {
                    const source = audioContext.createBufferSource();
                    source.buffer = decodedData;

                    const analyzer = audioContext.createAnalyser();
                    analyzer.fftSize = 1024;

                    source.connect(analyzer);
                    analyzer.connect(audioContext.destination);

                    setAudioAnalyzer(analyzer);

                    // Start playback
                    source.start();

                    // Synchronize captions
                    const totalDuration = decodedData.duration;
                    const wordDuration = totalDuration / wordsArray.length;
                    const startTime = audioContext.currentTime;

                    const updateCaptions = () => {
                        const elapsedTime = audioContext.currentTime - startTime;
                        const index = Math.floor(elapsedTime / wordDuration);
                        if (index < wordsArray.length) {
                            setCurrentWordIndex(index);
                            requestAnimationFrame(updateCaptions);
                        }
                    };

                    updateCaptions();

                    // Cleanup when audio finishes
                    source.onended = () => {
                        audioContext.close();
                        setAudioAnalyzer(null);
                        setCurrentWordIndex(0);
                    };
                },
                (error) => {
                    console.error('Error decoding audio data:', error);
                }
            );
        } else {
            console.error('Failed to generate audio data with meSpeak.');
        }
    };
    return (
        <div className="App">
            {loading ? (
                <div className="loading-screen">
                    <div className="spinner"></div>
                    <p>{ loadingProgress.text  || 'Loading...'} </p>
                </div>
            ) : !start ? (
                <div className="overlay">
                    <button className="start-button" onClick={handleStart}>
                        Enter the Realm
                    </button>
                </div>
            ) : (
                <>
                    <Canvas>
                        <MouthShader audioAnalyzer={audioAnalyzer} />
                    </Canvas>
                    <div className="captions">
                        {words.map((word, index) => (
                            <span key={index} className={index === currentWordIndex ? 'highlight' : ''}>
          {word}{' '}
        </span>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default App;
