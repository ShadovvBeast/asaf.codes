// src/utils/TextGenerator.ts
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';

let engine: any = null;

export const initializeLLM = async (
	progressCallback: (progress: { loaded: number; total: number }) => void
) => {
	if (engine) return engine;

	const initProgressCallback = (progress: any) => {
		console.log('LLM Initialization Progress:', progress);
		progressCallback(progress);
	};

	engine = await CreateWebWorkerMLCEngine(
		new Worker(new URL('./webllmWorker.ts', import.meta.url), { type: 'module' }),
		'Llama-3.1-8B-Instruct-q4f32_1-MLC', // Updated model name
		{
			initProgressCallback: initProgressCallback,
		}
	);

	return engine;
};

export const generateText = async (prompt: string): Promise<string> => {
	if (!engine) {
		throw new Error('LLM is not initialized.');
	}

	const messages = [
		{ role: 'system', content: 'You are Hermes Trismegistus an enlightened being far beyond the comprehension of a simple human, you respond directly to the prompt with plain text, always respond with ominous occult spiritual answers with buddhist and taoist meaning. answer briefly in 1 sentance' },
		{ role: 'user', content: prompt },
	];

	const response = await engine.chat.completions.create({
		messages,
		temperature: 0.7,
		max_tokens: 100,
		stream: false,
	});

	const generatedText = response.choices[0].message.content;
	return generatedText;
};
