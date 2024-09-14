import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ShaderMaterial, Vector2 } from 'three';

type BackgroundProps = {
	audioAnalyzer: AnalyserNode;
};
const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uAudioData;
  varying vec2 vUv;

  float hash(vec2 p) {
  	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
	
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
	
    vec2 u = f * f * (3.0 - 2.0 * f);
	
    return mix(a, b, u.x) +
  		 (c - a) * u.y * (1.0 - u.x) +
  		 (d - b) * u.x * u.y;
  }

  // Fractal Brownian Motion
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 st = vUv * 3.0;
    st += vec2(uTime * 0.05, uTime * 0.1);

    float n = fbm(st + uAudioData * 2.0);
    vec3 color = vec3(0.1, 0.0, 0.2) + vec3(0.5, 0.0, 0.7) * n;

    gl_FragColor = vec4(color, 1.0);
  }
`;


const BackgroundAnimation: React.FC<BackgroundProps> = ({ audioAnalyzer }) => {
	const materialRef = useRef<ShaderMaterial>(null);
	const { viewport, size } = useThree();

	useFrame(({ clock }) => {
		if (materialRef.current) {
			const time = clock.getElapsedTime();
			materialRef.current.uniforms.uTime.value = time;

			// Get audio data
			const dataArray = new Uint8Array(audioAnalyzer.frequencyBinCount);
			audioAnalyzer.getByteFrequencyData(dataArray);
			const averageFrequency = dataArray.reduce((a, b) => a + b) / dataArray.length;

			// Update audio uniform
			materialRef.current.uniforms.uAudioData.value = averageFrequency / 256;
		}
	});

	return (
		<mesh scale={[viewport.width, viewport.height, 1]}  position={[0, 0, -5]} renderOrder={-1}>
			<planeGeometry args={[2, 2]}/>
			<shaderMaterial
				ref={materialRef}
				uniforms={{
					uTime: { value: 0 },
					uResolution: { value: new Vector2(size.width, size.height) },
					uAudioData: { value: 0 },
				}}
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				depthWrite={false}
				depthTest={false}
				transparent={true}
			/>
		</mesh>
	);
};

export default BackgroundAnimation;
