// src/components/BackgroundAnimation.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, Mesh } from 'three';

interface BackgroundAnimationProps {
	audioAnalyzer: AnalyserNode;
}

const BackgroundAnimation: React.FC<BackgroundAnimationProps> = ({ audioAnalyzer }) => {
	const meshRef = useRef<Mesh>(null);

	// Custom shader material
	const shaderMaterial = new ShaderMaterial({
		uniforms: {
			time: { value: 0 },
			amplitude: { value: 0 },
		},
		vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec3 pos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
		fragmentShader: `
      uniform float time;
      uniform float amplitude;
      varying vec2 vUv;

      void main() {
        vec2 st = vUv;
        vec3 color = vec3(0.0);
        float pct = abs(sin(time + st.x * 10.0)) * amplitude;
        color = mix(vec3(0.1, 0.0, 0.3), vec3(0.8, 0.0, 0.5), pct);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
		transparent: true,
		depthWrite: false,
		depthTest: false,
	});

	useFrame((state, delta) => {
		if (audioAnalyzer) {
			const dataArray = new Uint8Array(audioAnalyzer.frequencyBinCount);
			audioAnalyzer.getByteFrequencyData(dataArray);

			// Calculate average amplitude
			const avgAmplitude = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
			const normalizedAmplitude = avgAmplitude / 256;

			// Update uniforms
			shaderMaterial.uniforms.time.value += delta;
			shaderMaterial.uniforms.amplitude.value = normalizedAmplitude;
		}
	});

	return (
		<mesh
			ref={meshRef}
			position={[0, 0, -10]} // Position it behind other objects
			renderOrder={-1} // Ensure it renders first
		>
			<planeGeometry args={[20, 20]} />
			<primitive object={shaderMaterial} attach="material" />
		</mesh>
	);
};

export default BackgroundAnimation;
