import { GoogleGenerativeAI } from '@google/generative-ai';

export const transcribeAudio = async (
  audioBlob: Blob,
  apiKey: string
): Promise<string> => {
  try {
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini 2.5 Flash for transcription
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Convert blob to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    // Extract the actual base64 data (remove data:audio/webm;base64, prefix)
    const base64Data = base64Audio.split(',')[1];

    // Prepare the audio data for Gemini
    const audioPart = {
      inlineData: {
        data: base64Data,
        mimeType: audioBlob.type || 'audio/webm',
      },
    };

    // Create the prompt
    const prompt = 'Transcribe this audio accurately. Only provide the transcription text, nothing else.';

    // Generate content
    const result = await model.generateContent([prompt, audioPart]);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(
      error instanceof Error 
        ? `Transcription failed: ${error.message}` 
        : 'Transcription failed'
    );
  }
};

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
