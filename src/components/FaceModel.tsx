// src/components/FaceModel.tsx
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import ProceduralMouth from './ProceduralMouth';

interface FaceModelProps {
	audioAnalyzer: AnalyserNode;
}

const FaceModel: React.FC<FaceModelProps> = ({ audioAnalyzer }) => {
	const group = useRef<Group>(null);
	const [mouthOpenValue, setMouthOpenValue] = useState(0);

	useFrame(() => {
		if (!audioAnalyzer) return;

		// Get audio data
		const dataArray = new Uint8Array(audioAnalyzer.frequencyBinCount);
		audioAnalyzer.getByteFrequencyData(dataArray);

		// Calculate average volume
		const avgVolume =
			dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
		const normalizedVolume = avgVolume / 256; // Normalize between 0 and 1

		// Smooth the mouthOpenValue
		const damping = 0.1;
		setMouthOpenValue((prev) => prev + (normalizedVolume - prev) * damping);
	});

	return (
		<group ref={group} position={[0, 1.5, 0]}>
			{/* Head */}
			<mesh position={[0, 0, 0]}>
				<sphereGeometry args={[1.5, 32, 32]} />
				<meshStandardMaterial color="#ffe0bd" />
			</mesh>

			{/* Eyes */}
			<mesh position={[-0.5, 0.5, 1]}>
				<sphereGeometry args={[0.2, 16, 16]} />
				<meshStandardMaterial color="#000000" />
			</mesh>
			<mesh position={[0.5, 0.5, 1]}>
				<sphereGeometry args={[0.2, 16, 16]} />
				<meshStandardMaterial color="#000000" />
			</mesh>

			{/* Procedural Mouth */}
			<group position={[0, -0.5, 1]}>
				<ProceduralMouth mouthOpenValue={mouthOpenValue} />
			</group>
		</group>
	);
};

export default FaceModel;
