// src/utils/TextGenerator.ts
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';

let engine: any = null;

export const initializeLLM = async () => {
	if (engine) return engine;

	// Callback to update model loading progress
	const initProgressCallback = (progress: any) => {
		console.log('LLM Initialization Progress:', progress);
	};

	// Initialize the engine with a Web Worker
	engine = await CreateWebWorkerMLCEngine(
		new Worker(new URL('./webllmWorker.ts', import.meta.url), { type: 'module' }),
		'Llama-3.1-8B-Instruct-q4f32_1-MLC', // Model name
		{
			initProgressCallback: initProgressCallback,
		}
	);

	return engine;
};

export const generateText = async (prompt: string): Promise<string> => {
	if (!engine) {
		await initializeLLM();
	}

	// Prepare the messages
	const messages = [
		{ role: 'system', content: 'You are an ominous, deep-voiced assistant.' },
		{ role: 'user', content: prompt },
	];

	// Generate text
	const response = await engine.chat.completions.create({
		messages,
		temperature: 0.7,
		max_tokens: 100,
		stream: false,
	});

	const generatedText = response.choices[0].message.content;
	return generatedText;
};
