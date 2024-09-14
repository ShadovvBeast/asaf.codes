import React, { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useThree } from '@react-three/fiber';

import FaceModel from './FaceModel';
import BackgroundAnimation from './BackgroundAnimation';

export default function Experience() {
	const [audioAnalyzer, setAudioAnalyzer] = useState<AnalyserNode | null>(null);
	const { camera } = useThree();

	useEffect(() => {
		// Load and play audio after user interaction
		const audio = new Audio('/audio/voice.mp3'); // Ensure this file contains your specified message
		audio.crossOrigin = 'anonymous';
		audio.loop = false; // Play the message once

		// Create Audio Context and Analyzer
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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

		// Camera animation (optional for immersion)
		camera.position.set(0, 1.5, 5);
		camera.lookAt(0, 1.5, 0);

		gsap.to(camera.position, {
			z: 3.5, // Move closer if needed
			duration: 10,
			ease: 'power2.inOut',
		});

		return () => {
			audio.pause();
			audioContext.close();
		};
	}, [camera]);

	if (!audioAnalyzer) return null;

	return (
		<>
			<BackgroundAnimation audioAnalyzer={audioAnalyzer} />
			<FaceModel audioAnalyzer={audioAnalyzer} />
		</>
	);
}
