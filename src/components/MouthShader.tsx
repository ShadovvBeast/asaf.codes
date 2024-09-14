// src/components/MouthShader.tsx
import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, ShaderMaterial } from 'three';
import meSpeak, { initializeMeSpeak } from '../utils/mespeakLoader';
import { generateText, initializeLLM } from '../utils/TextGenerator';

const MouthShader: React.FC<{ start: boolean }> = ({ start }) => {
	const meshRef = useRef<Mesh>(null);
	const audioAnalyzerRef = useRef<AnalyserNode | null>(null);
	const { viewport, size } = useThree();

	// Create the ShaderMaterial with uniforms and shaders
	const shaderMaterial = useRef(
		new ShaderMaterial({
			uniforms: {
				uTime: { value: 0 },
				uBass: { value: 0 },
				uMid: { value: 0 },
				uTreble: { value: 0 },
				uResolution: { value: [size.width, size.height] },
			},
			vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
			fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform vec2 uResolution;
        varying vec2 vUv;

        // Noise function for texture
        float hash(vec2 p) {
          return fract(sin(dot(p ,vec2(127.1,311.7))) * 43758.5453123);
        }

        float noise(vec2 p){
          vec2 i = floor(p);
          vec2 f = fract(p);

          // Four corners in 2D of a tile
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));

          // Smooth interpolation
          vec2 u = f * f * (3.0 - 2.0 * f);

          // Mix the four corners
          return mix(a, b, u.x) + 
                 (c - a) * u.y * (1.0 - u.x) + 
                 (d - b - c + a) * u.x * u.y;
        }

        void main() {
          // Normalize coordinates
          vec2 uv = vUv * 2.0 - 1.0;
          uv.x *= uResolution.x / uResolution.y; // Correct aspect ratio

          // Time variable
          float time = uTime * 0.5;

          // Base color
          vec3 color = vec3(0.0);

          // Face shape (circle)
          float faceRadius = 0.8;
          float distFromCenter = length(uv);
          float face = smoothstep(faceRadius, faceRadius - 0.02, distFromCenter);

          // Add subtle noise to the face
          float faceNoise = noise(uv * 3.0 + time) * 0.05;
          face -= faceNoise;

          // Eyes positions
          vec2 leftEyePos = vec2(-0.25, 0.2 + uMid * 0.05);
          vec2 rightEyePos = vec2(0.25, 0.2 + uMid * 0.05);

          // Eye radius adjusts with mid frequencies
          float eyeRadius = 0.07 + uMid * 0.03;

          // Eyes
          float leftEye = 1.0 - smoothstep(eyeRadius - 0.005, eyeRadius, length(uv - leftEyePos));
          float rightEye = 1.0 - smoothstep(eyeRadius - 0.005, eyeRadius, length(uv - rightEyePos));

          // Blinking effect based on treble frequencies
          float blink = sin(uTime * 10.0 + uTreble * 20.0) * 0.5 + 0.5;
          blink = smoothstep(0.3, 0.7, blink);
          leftEye *= blink;
          rightEye *= blink;

          // Eyebrows positions
          vec2 leftBrowPos = leftEyePos + vec2(0.0, 0.12 + uTreble * 0.05);
          vec2 rightBrowPos = rightEyePos + vec2(0.0, 0.12 + uTreble * 0.05);

          // Eyebrows
          float browThickness = 0.02 + uTreble * 0.02;
          float leftBrow = 1.0 - smoothstep(browThickness - 0.005, browThickness, abs(uv.y - leftBrowPos.y) + abs(uv.x - leftBrowPos.x));
          float rightBrow = 1.0 - smoothstep(browThickness - 0.005, browThickness, abs(uv.y - rightBrowPos.y) + abs(uv.x - rightBrowPos.x));

          // Nose (vertical line)
          float noseWidth = 0.03;
          float nose = 1.0 - smoothstep(noseWidth - 0.005, noseWidth, abs(uv.x)) * smoothstep(-0.1, -0.3, uv.y);

          // Mouth
          float mouthWidth = 0.4;
          float mouthHeight = 0.05 + uBass * 0.2;
          float mouthY = -0.3;
          float mouth = 1.0 - smoothstep(mouthHeight - 0.005, mouthHeight, abs(uv.y - mouthY)) *
                        smoothstep(mouthWidth - 0.005, mouthWidth, abs(uv.x));

          // Combine features using max to ensure visibility
          float features = max(max(max(max(leftEye, rightEye), leftBrow), rightBrow), max(mouth, nose));

          // Final color
          color = vec3(0.2, 0.6, 1.0) * face * features;

          // Add glow effect
          float glow = exp(-3.0 * distFromCenter) * (0.5 + 0.5 * sin(uTime * 2.0 + uBass * 5.0));
          color += glow;

          // Edge fade
          float edgeFade = smoothstep(1.0, 0.7, distFromCenter);
          color *= edgeFade;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
		})
	).current;

	// Update the uResolution uniform on resize
	useEffect(() => {
		const handleResize = () => {
			shaderMaterial.uniforms.uResolution.value = [window.innerWidth, window.innerHeight];
		};
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [shaderMaterial]);

	// useEffect(() => {
	// 	// Initialize audio context and analyzer
	// 	const audio = new Audio('/audio/voice.mp3');
	// 	audio.crossOrigin = 'anonymous';
	// 	audio.loop = true;
	//
	// 	const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
	// 	const source = audioContext.createMediaElementSource(audio);
	// 	const analyzer = audioContext.createAnalyser();
	// 	analyzer.fftSize = 1024;
	//
	// 	source.connect(analyzer);
	// 	analyzer.connect(audioContext.destination);
	//
	// 	audioAnalyzerRef.current = analyzer;
	//
	// 	// Play audio
	// 	audio.play().catch((error) => {
	// 		console.error('Audio playback failed:', error);
	// 	});
	//
	// 	return () => {
	// 		audio.pause();
	// 		audioContext.close();
	// 	};
	// }, []);

	useEffect(() => {
		if (!start) return;

		const run = async () => {
			// Initialize meSpeak
			await initializeMeSpeak();

			// Initialize LLM
			await initializeLLM();

			// Generate text using LLM
			const text = await generateText('Generate an ominous message.');

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

						audioAnalyzerRef.current = analyzer;

						// Start playback
						source.start();

						// Cleanup
						return () => {
							source.stop();
							audioContext.close();
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

		run();
	}, [start]);


	useFrame((state, delta) => {
		shaderMaterial.uniforms.uTime.value += delta;

		if (audioAnalyzerRef.current) {
			const dataArray = new Uint8Array(audioAnalyzerRef.current.frequencyBinCount);
			audioAnalyzerRef.current.getByteFrequencyData(dataArray);

			// Divide frequency data into bands
			const bassRange = dataArray.slice(0, dataArray.length / 4);
			const midRange = dataArray.slice(dataArray.length / 4, dataArray.length / 2);
			const trebleRange = dataArray.slice(dataArray.length / 2, dataArray.length);

			// Calculate average values for each band
			const bass = bassRange.reduce((sum, value) => sum + value, 0) / bassRange.length;
			const mid = midRange.reduce((sum, value) => sum + value, 0) / midRange.length;
			const treble = trebleRange.reduce((sum, value) => sum + value, 0) / trebleRange.length;

			// Normalize the values
			shaderMaterial.uniforms.uBass.value = bass / 256;
			shaderMaterial.uniforms.uMid.value = mid / 256;
			shaderMaterial.uniforms.uTreble.value = treble / 256;
		}
	});

	return (
		<mesh ref={meshRef} material={shaderMaterial}>
			<planeGeometry args={[2, 2]} />
		</mesh>
	);
};

export default MouthShader;
