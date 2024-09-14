// src/components/ProceduralMouth.tsx
import React, { useRef, useMemo } from 'react';
import { Mesh, BufferGeometry, Float32BufferAttribute } from 'three';
import { useFrame } from '@react-three/fiber';

interface ProceduralMouthProps {
	mouthOpenValue: number;
}

const ProceduralMouth: React.FC<ProceduralMouthProps> = ({ mouthOpenValue }) => {
	const meshRef = useRef<Mesh>(null);

	// Create mouth geometry
	const mouthGeometry = useMemo(() => {
		const geometry = new BufferGeometry();

		// Define vertices and indices
		const vertices = new Float32Array([
			// Upper lip
			-0.5, 0, 0,
			-0.25, 0.1, 0,
			0, 0.15, 0,
			0.25, 0.1, 0,
			0.5, 0, 0,
			// Lower lip
			-0.5, 0, 0,
			-0.25, -0.1, 0,
			0, -0.15, 0,
			0.25, -0.1, 0,
			0.5, 0, 0,
		]);

		const indices = [
			// Upper lip
			0, 1, 5,
			1, 6, 5,
			1, 2, 6,
			2, 7, 6,
			2, 3, 7,
			3, 8, 7,
			3, 4, 8,
			4, 9, 8,
			// Connecting vertices
			0, 5, 9,
			0, 9, 4,
		];

		geometry.setIndex(indices);
		geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
		geometry.computeVertexNormals();

		return geometry;
	}, []);

	useFrame(() => {
		if (!meshRef.current) return;

		const positions = mouthGeometry.attributes.position.array as Float32Array;

		// Modify lower lip vertices to simulate mouth opening
		positions[19] = -0.1 - mouthOpenValue * 0.2; // Vertex 6, y-coordinate
		positions[22] = -0.15 - mouthOpenValue * 0.2; // Vertex 7, y-coordinate
		positions[25] = -0.1 - mouthOpenValue * 0.2; // Vertex 8, y-coordinate

		mouthGeometry.attributes.position.needsUpdate = true;
		mouthGeometry.computeVertexNormals();
	});

	return (
		<mesh ref={meshRef} geometry={mouthGeometry}>
			<meshStandardMaterial color="#ff6666" />
		</mesh>
	);
};

export default ProceduralMouth;
