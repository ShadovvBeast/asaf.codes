import React, { useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Group, MeshStandardMaterial, Color } from 'three';
import { gsap } from 'gsap';

export default function FaceModel({ audioAnalyzer }: { audioAnalyzer: AnalyserNode }) {
	const group = useRef<Group>(null);
	const { scene } = useGLTF('/models/face.glb');

	useEffect(() => {
		// Adjust materials for a more ominous look
		scene.traverse((child: any) => {
			if (child.isMesh) {
				const material = child.material as MeshStandardMaterial;
				material.color = new Color(0x888888);
				material.roughness = 0.7;
				material.metalness = 0.1;
				material.transparent = true; // Enable transparency
				material.opacity = 0; // Start fully transparent
			}
		});

		// Animate the face appearing
		if (group.current) {
			// Scale from 0 to 1
			group.current.scale.set(0, 0, 0);

			gsap.to(group.current.scale, {
				x: 1,
				y: 1,
				z: 1,
				duration: 3,
				ease: 'power2.out',
			});

			// Fade in materials
			const materials: MeshStandardMaterial[] = [];
			scene.traverse((child: any) => {
				if (child.isMesh) {
					materials.push(child.material);
				}
			});

			// Delay the animation
			gsap.to(group.current.scale, {
				x: 1,
				y: 1,
				z: 1,
				duration: 3,
				ease: 'power2.out',
				delay: 2, // Delay in seconds
			});

			gsap.to(materials, {
				opacity: 1,
				duration: 3,
				ease: 'power2.out',
				stagger: 0.1,
				delay: 2,
			});
		}
	}, [scene]);

	useFrame(() => {
		// Get audio data
		const dataArray = new Uint8Array(audioAnalyzer.frequencyBinCount);
		audioAnalyzer.getByteFrequencyData(dataArray);

		// Calculate average volume
		const avgVolume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
		const mouthOpenValue = avgVolume / 256; // Normalize between 0 and 1

		// Update mouth morph target
		if (group.current) {
			group.current.traverse((child: any) => {
				if (child.isMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
					const mouthOpenIndex = child.morphTargetDictionary['MouthOpen'];
					if (mouthOpenIndex !== undefined) {
						child.morphTargetInfluences[mouthOpenIndex] = mouthOpenValue;
					}
				}
			});
		}
	});

	const [morphTargetValues, setMorphTargetValues] = useState({});

	function updateMorphTargets() {
		if (group.current) {
			group.current.traverse((child: any) => {
				if (child.isMesh && child.morphTargetInfluences) {
					Object.keys(morphTargetValues).forEach((key) => {
						const index = child.morphTargetDictionary[key];
						if (index !== undefined) {
							child.morphTargetInfluences[index] = morphTargetValues[key];
						}
					});
				}
			});
		}
	}

	// Update morph targets when values change
	useEffect(() => {
		updateMorphTargets();
	}, [morphTargetValues]);

	return <primitive ref={group} object={scene} />;
}
