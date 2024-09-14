// src/components/Experience.tsx
import React, { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import FaceModel from './FaceModel';
import BackgroundAnimation from './BackgroundAnimation';

const Experience: React.FC = () => {
	const [audioAnalyzer, setAudioAnalyzer] = useState<AnalyserNode | null>(null);
	const { camera } = useThree();

	useEffect(() => {
		// Load and play audio after user interaction
		const audio = new Audio('/audio/voice.mp3');
		audio.crossOrigin = 'anonymous';
		audio.loop = false;

		// Create Audio Context and Analyzer
		const audioContext = new (window.AudioContext ||
			(window as any).webkitAudioContext)();
		const source = audioContext.createMediaElementSource(audio);
		const analyzer = audioContext.createAnalyser();
		analyzer.fftSize = 2048;

		source.connect(analyzer);
		analyzer.connect(audioContext.destination);

		setAudioAnalyzer(analyzer);

		// Play audio
		audio.play().catch((error) => {
			console.error('Audio playback failed:', error);
		});

		return () => {
			audio.pause();
			audioContext.close();
		};
	}, []);

	if (!audioAnalyzer) return null;

	return (
		<>
			<BackgroundAnimation audioAnalyzer={audioAnalyzer} />
			<FaceModel audioAnalyzer={audioAnalyzer} />
		</>
	);
};

export default Experience;
