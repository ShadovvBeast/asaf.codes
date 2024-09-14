// src/utils/mespeakLoader.ts
import meSpeak from 'mespeak';

// Import meSpeak configuration and voice files
import meSpeakConfig from 'mespeak/src/mespeak_config.json';
import enVoice from 'mespeak/voices/en/en.json';

export const initializeMeSpeak = () => {
	return new Promise<void>((resolve, reject) => {
		meSpeak.loadConfig(meSpeakConfig);
		meSpeak.loadVoice(enVoice, () => {
			resolve();
		}, (error) => {
			reject(error);
		});
	});
};

export default meSpeak;
