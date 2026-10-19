const express = require('express');
const router = express.Router();
const multer = require('multer');
const { transcribeAudioBuffer, DEEPGRAM_API_KEY, translateSpanishToEnglishFast } = require('../services/deepgramService');

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });

// Check Deepgram connection health & configuration
router.get('/health', async (req, res) => {
  try {
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      headers: { Authorization: `Token ${DEEPGRAM_API_KEY}` },
    });
    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        status: 'connected',
        provider: 'Deepgram Nova-2',
        projects: data.projects?.map((p) => ({ id: p.project_id, name: p.name })),
      });
    } else {
      return res.status(response.status).json({
        success: false,
        status: 'error',
        code: response.status,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Direct audio buffer transcription endpoint
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio file is required' });
    }

    const result = await transcribeAudioBuffer(req.file.buffer, req.file.mimetype || 'audio/webm');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Real-time Spanish to English translation helper endpoint
router.post('/translate-es-en', express.json(), (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: 'Text is required' });
  }
  const translated = translateSpanishToEnglishFast(text);
  res.json({
    success: true,
    originalText: text,
    translatedTextEn: translated,
  });
});

module.exports = router;
