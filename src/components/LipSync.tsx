import React, { useEffect, useState } from 'react';
import { FaceModel } from './FaceModel';

export default function LipSync() {
	const [audioAnalyzer, setAudioAnalyzer] = useState<AnalyserNode | null>(null);

	useEffect(() => {
		// Load and play audio
		const audio = new Audio('/audio/voice.mp3'); // Place your audio file in public/audio/voice.mp3
		audio.crossOrigin = 'anonymous';
		audio.loop = true;
		audio.play();

		// Create Audio Context and Analyzer
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		const source = audioContext.createMediaElementSource(audio);
		const analyzer = audioContext.createAnalyser();
		analyzer.fftSize = 2048;

		source.connect(analyzer);
		analyzer.connect(audioContext.destination);

		setAudioAnalyzer(analyzer);

		// Cleanup
		return () => {
			audio.pause();
			audioContext.close();
		};
	}, []);

	if (!audioAnalyzer) return null;

	return <FaceModel audioAnalyzer={audioAnalyzer} />;
}
