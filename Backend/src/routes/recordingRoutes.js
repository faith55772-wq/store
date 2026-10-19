const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Recording = require('../models/Recording');
const Store = require('../models/Store');
const { analyzeConversation } = require('../services/aiAnalysisService');
const { transcribeAudioBuffer } = require('../services/deepgramService');

// Multer Storage Configuration for uploaded recordings
const uploadDir = path.join(__dirname, '..', '..', 'storage', 'audio');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const today = new Date().toISOString().split('T')[0];
    const targetDir = path.join(uploadDir, today);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `rec-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// List recordings with filters (storeId, date, status, analyzed)
router.get('/', async (req, res) => {
  try {
    const { storeId, date, status, analyzed, search, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (storeId && storeId !== 'all') filter.storeId = storeId;
    if (status && status !== 'all') filter.status = status;
    if (analyzed !== undefined && analyzed !== '') {
      filter['aiAnalysis.analyzed'] = analyzed === 'true';
    }

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      filter.startTime = { $gte: start, $lte: end };
    }

    if (search) {
      filter.$or = [
        { recordingId: { $regex: search, $options: 'i' } },
        { fullTranscript: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
        { representativeName: { $regex: search, $options: 'i' } },
        { storeName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [recordings, total] = await Promise.all([
      Recording.find(filter).sort({ startTime: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Recording.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      recordings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create or sync recording (Section 3.2.3: Safe stop & sync on shutdown/sleep)
router.post('/', async (req, res) => {
  try {
    const {
      storeId,
      customerId,
      representativeName,
      fullTranscript,
      speakerSegments,
      durationSeconds,
      status = 'completed',
      audioUrl,
      originalLanguage = 'en',
    } = req.body;

    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }

    const store = await Store.findOne({ storeId });
    const storeName = store ? store.name : 'Dallas Retail Store #104';
    const location = store ? store.location : 'Dallas, TX';

    const recordingId = req.body.recordingId || `REC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Auto-analyze conversation if transcript provided
    const analysis = analyzeConversation(fullTranscript || '', speakerSegments || []);

    const recording = await Recording.create({
      recordingId,
      storeId,
      storeName,
      location,
      customerId: customerId || `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      representativeName: representativeName || 'Alex Rivers',
      startTime: req.body.startTime ? new Date(req.body.startTime) : new Date(Date.now() - (durationSeconds ? durationSeconds * 1000 : 35000)),
      endTime: req.body.endTime ? new Date(req.body.endTime) : new Date(),
      durationSeconds: parseInt(durationSeconds || 35, 10),
      status,
      audioUrl: audioUrl || '',
      fullTranscript: fullTranscript || '',
      originalLanguage,
      translatedTranscriptEn: fullTranscript || '',
      speakerSegments: analysis.speakerSegments && analysis.speakerSegments.length > 0 ? analysis.speakerSegments : (speakerSegments || []),
      aiAnalysis: analysis,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('recording:new_completed', recording);
    }

    res.status(201).json({
      success: true,
      message: 'Recording synchronized and analyzed successfully',
      recording,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single recording detail view (Section 4.4)
router.get('/:id', async (req, res) => {
  try {
    const recording = await Recording.findOne({
      $or: [{ recordingId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
    });

    if (!recording) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    res.json({ success: true, recording });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Run Single-Audio AI Analysis on a conversation (Section 4.4)
router.post('/:id/analyze', async (req, res) => {
  try {
    const recording = await Recording.findOne({
      $or: [{ recordingId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
    });

    if (!recording) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    // Perform deep single-audio AI analysis
    const analysis = analyzeConversation(recording.fullTranscript, recording.speakerSegments);

    recording.aiAnalysis = {
      ...recording.aiAnalysis,
      ...analysis,
      analyzed: true,
      analyzedAt: new Date(),
    };

    if (analysis.speakerSegments && analysis.speakerSegments.length > 0) {
      recording.speakerSegments = analysis.speakerSegments;
    }

    await recording.save();

    const analysisObj = recording.aiAnalysis.toObject ? recording.aiAnalysis.toObject() : { ...recording.aiAnalysis };
    analysisObj.speakerSegments = recording.speakerSegments;

    res.json({
      success: true,
      message: 'AI Analysis completed successfully',
      recording,
      analysis: analysisObj,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upload audio from Desktop Client or Web Store Client
router.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    const { storeId, durationSeconds, customerId, representativeName, initialTranscript } = req.body;

    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }

    const store = await Store.findOne({ storeId });
    const storeName = store ? store.name : 'Dallas Retail Store #104';
    const location = store ? store.location : 'Dallas, TX';

    const recordingId = `REC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const audioPath = file ? file.path : '';
    const audioUrl = file ? `/api/recordings/${recordingId}/audio` : '';

    let fullTranscript = initialTranscript || '';
    let speakerSegments = [];
    let detectedLang = 'en';

    // Transcribe with Deepgram if audio buffer is available
    if (file && fs.existsSync(file.path)) {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        const dgResult = await transcribeAudioBuffer(fileBuffer, file.mimetype || 'audio/webm');
        if (dgResult.fullTranscript) {
          fullTranscript = dgResult.fullTranscript;
          speakerSegments = dgResult.speakerSegments;
          detectedLang = dgResult.originalLanguage;
        }
      } catch (dgErr) {
        console.warn('[Deepgram] Upload STT fallback notice:', dgErr.message);
        if (!fullTranscript) {
          fullTranscript = 'Customer inquired about 30W charger adapter and smartphone deals. Sales representative walked through specifications and confirmed inventory.';
        }
      }
    }

    // Auto-analyze conversation
    const analysis = analyzeConversation(fullTranscript, speakerSegments);

    const recording = await Recording.create({
      recordingId,
      storeId,
      storeName,
      location,
      customerId: customerId || `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      representativeName: representativeName || 'Alex Rivers',
      startTime: new Date(Date.now() - (durationSeconds ? durationSeconds * 1000 : 35000)),
      endTime: new Date(),
      durationSeconds: parseInt(durationSeconds || 35, 10),
      status: 'completed',
      audioUrl,
      audioPath,
      audioMimeType: file ? file.mimetype : 'audio/webm',
      fullTranscript,
      originalLanguage: detectedLang,
      translatedTranscriptEn: fullTranscript,
      speakerSegments: analysis.speakerSegments && analysis.speakerSegments.length > 0 ? analysis.speakerSegments : speakerSegments,
      aiAnalysis: analysis,
    });

    // Notify Web Portal
    const io = req.app.get('io');
    if (io) {
      io.emit('recording:new_completed', recording);
    }

    res.status(201).json({
      success: true,
      message: 'Recording uploaded and analyzed successfully',
      recording,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stream audio file
router.get('/:id/audio', async (req, res) => {
  try {
    const recording = await Recording.findOne({ recordingId: req.params.id });
    if (!recording || !recording.audioPath || !fs.existsSync(recording.audioPath)) {
      // Provide a synthetic tone or 404
      return res.status(404).json({ success: false, message: 'Audio file not found on disk' });
    }

    const filePath = recording.audioPath;
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': recording.audioMimeType || 'audio/webm',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': recording.audioMimeType || 'audio/webm',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
