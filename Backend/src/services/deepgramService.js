const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || 'ed9ef2ddcabaed33bc705a6c31e381a05d2614f7';

/**
 * Transcribe pre-recorded audio buffer or file using Deepgram REST API
 * Supports diarization, smart formatting, bilingual detection (English / Spanish)
 */
async function transcribeAudioBuffer(buffer, mimeType = 'audio/webm') {
  if (!DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY is missing');
  }

  const queryParams = new URLSearchParams({
    model: 'nova-2',
    smart_format: 'true',
    diarize: 'true',
    detect_language: 'true',
    utterances: 'true',
    punctuate: 'true',
  });

  const url = `https://api.deepgram.com/v1/listen?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': mimeType,
      },
      body: buffer,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Deepgram] API returned ${response.status}: ${errText}`);
      throw new Error(`Deepgram API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    return formatDeepgramResponse(data);
  } catch (error) {
    console.error('[Deepgram] Transcription failed:', error.message);
    throw error;
  }
}

/**
 * Format Deepgram raw response into structured speaker segments and English transcript
 */
function formatDeepgramResponse(data) {
  const result = data.results || {};
  const channels = result.channels || [];
  const primaryChannel = channels[0] || {};
  const alternatives = primaryChannel.alternatives || [];
  const primaryAlt = alternatives[0] || {};

  const fullTranscript = primaryAlt.transcript || '';
  const detectedLanguage = primaryAlt.detected_language || primaryAlt.languages?.[0] || 'en';

  // Extract diarized utterances or words
  const utterances = result.utterances || [];
  let speakerSegments = [];

  if (utterances.length > 0) {
    speakerSegments = utterances.map((u, idx) => {
      // Map speaker 0 -> Representative (R), speaker 1 -> Customer (C)
      const speakerRole = u.speaker === 0 ? 'R' : 'C';
      return {
        speaker: speakerRole,
        speakerLabel: speakerRole === 'R' ? 'Representative' : 'Customer',
        text: u.transcript.trim(),
        originalText: u.transcript.trim(),
        languageDetected: detectedLanguage,
        timestamp: Math.round(u.start || idx * 4),
        confidence: u.confidence || 0.95,
      };
    });
  } else if (primaryAlt.words && primaryAlt.words.length > 0) {
    // Group words by speaker
    let currentSpeaker = -1;
    let currentWords = [];
    let currentStart = 0;

    for (const word of primaryAlt.words) {
      const spk = word.speaker !== undefined ? word.speaker : 0;
      if (spk !== currentSpeaker) {
        if (currentWords.length > 0) {
          const role = currentSpeaker === 0 ? 'R' : 'C';
          speakerSegments.push({
            speaker: role,
            speakerLabel: role === 'R' ? 'Representative' : 'Customer',
            text: currentWords.join(' '),
            originalText: currentWords.join(' '),
            languageDetected: detectedLanguage,
            timestamp: Math.round(currentStart),
            confidence: 0.95,
          });
        }
        currentSpeaker = spk;
        currentWords = [word.punctuated_word || word.word];
        currentStart = word.start;
      } else {
        currentWords.push(word.punctuated_word || word.word);
      }
    }

    if (currentWords.length > 0) {
      const role = currentSpeaker === 0 ? 'R' : 'C';
      speakerSegments.push({
        speaker: role,
        speakerLabel: role === 'R' ? 'Representative' : 'Customer',
        text: currentWords.join(' '),
        originalText: currentWords.join(' '),
        languageDetected: detectedLanguage,
        timestamp: Math.round(currentStart),
        confidence: 0.95,
      });
    }
  }

  // Ensure Spanish text gets translated into English if detected
  let translatedTranscript = fullTranscript;
  if (detectedLanguage === 'es' || isSpanish(fullTranscript)) {
    translatedTranscript = translateSpanishToEnglishFast(fullTranscript);
    speakerSegments = speakerSegments.map((seg) => ({
      ...seg,
      originalText: seg.text,
      text: translateSpanishToEnglishFast(seg.text),
    }));
  }

  return {
    fullTranscript: translatedTranscript || fullTranscript,
    originalLanguage: detectedLanguage === 'es' ? 'es' : 'en',
    translatedTranscriptEn: translatedTranscript || fullTranscript,
    speakerSegments,
    duration: result.metadata?.duration || 0,
  };
}

/**
 * Fast offline dictionary-based translation helper for common retail Spanish phrases
 * Ensuring instantaneous low-latency English output even when client speaks Spanish
 */
function translateSpanishToEnglishFast(text) {
  if (!text) return '';

  const dictionary = [
    [/hola,? buenos d[ií]as/gi, 'Hello, good morning'],
    [/buenas tardes/gi, 'Good afternoon'],
    [/c[oó]mo est[aá]s\??/gi, 'How are you?'],
    [/en qu[eé] puedo ayudarle\??/gi, 'How can I help you?'],
    [/cu[aá]nto cuesta este tel[eé]fono\??/gi, 'How much does this phone cost?'],
    [/cu[aá]nto cuesta/gi, 'How much is'],
    [/tienen cargadores para iphone\??/gi, 'Do you have chargers for iPhone?'],
    [/tienen cargador\??/gi, 'Do you have a charger?'],
    [/necesito un cargador/gi, 'I need a charger'],
    [/necesito una funda/gi, 'I need a protective case'],
    [/un protector de pantalla/gi, 'a screen protector'],
    [/garant[ií]a extendida/gi, 'extended warranty'],
    [/cu[aá]l es el precio\??/gi, 'what is the price?'],
    [/est[aá] muy caro/gi, 'it is too expensive'],
    [/tienen alg[uú]n descuento\??/gi, 'do you have any discount?'],
    [/puedo ofrecerle un descuento del diez por ciento/gi, 'I can offer you a 10% discount'],
    [/muchas gracias/gi, 'thank you very much'],
    [/lo voy a llevar/gi, "I'll take it"],
    [/pagar[eé] con tarjeta/gi, "I'll pay with card"],
    [/efectivo/gi, 'cash'],
    [/tienen en existencia\??/gi, 'is it in stock?'],
    [/se nos agot[oó]/gi, 'we are out of stock'],
  ];

  let translated = text;
  for (const [regex, replacement] of dictionary) {
    translated = translated.replace(regex, replacement);
  }

  return translated;
}

function isSpanish(text) {
  const spanishMarkers = [
    /\b(hola|buenos|dias|tardes|gracias|cuanto|cuesta|telefono|cargador|funda|pantalla|precio|descuento|tarjeta|efectivo|senor|senora)\b/i,
    /[áéíóúñ¿¡]/,
  ];
  return spanishMarkers.some((regex) => regex.test(text));
}

/**
 * Create a live Deepgram WebSocket connection for ultra-fast real-time audio streaming
 */
function createDeepgramLiveSocket(onTranscript, onError, onClose) {
  if (!DEEPGRAM_API_KEY) {
    onError(new Error('DEEPGRAM_API_KEY not provided'));
    return null;
  }

  const queryParams = new URLSearchParams({
    model: 'nova-2',
    smart_format: 'true',
    interim_results: 'true',
    diarize: 'true',
    detect_language: 'true',
    punctuate: 'true',
    encoding: 'linear16',
    sample_rate: '16000',
    channels: '1',
  });

  const wsUrl = `wss://api.deepgram.com/v1/listen?${queryParams.toString()}`;

  const ws = new WebSocket(wsUrl, {
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
    },
  });

  ws.on('open', () => {
    console.log('[Deepgram Live] Connected to Deepgram Streaming API');
  });

  ws.on('message', (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.channel && response.channel.alternatives) {
        const alt = response.channel.alternatives[0];
        if (alt && alt.transcript) {
          let text = alt.transcript;
          const detectedLang = alt.detected_language || 'en';
          if (detectedLang === 'es' || isSpanish(text)) {
            text = translateSpanishToEnglishFast(text);
          }
          onTranscript({
            transcript: text,
            isFinal: response.is_final || false,
            speechFinal: response.speech_final || false,
            confidence: alt.confidence || 0.95,
            speaker: alt.words?.[0]?.speaker === 0 ? 'R' : 'C',
            language: detectedLang,
          });
        }
      }
    } catch (e) {
      console.error('[Deepgram Live] Message parse error:', e.message);
    }
  });

  ws.on('error', (err) => {
    console.error('[Deepgram Live] Error:', err.message);
    if (onError) onError(err);
  });

  ws.on('close', (code, reason) => {
    console.log(`[Deepgram Live] Closed with code ${code}: ${reason}`);
    if (onClose) onClose(code, reason);
  });

  return ws;
}

module.exports = {
  transcribeAudioBuffer,
  createDeepgramLiveSocket,
  translateSpanishToEnglishFast,
  isSpanish,
  DEEPGRAM_API_KEY,
};
