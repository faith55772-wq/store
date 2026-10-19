const mongoose = require('mongoose');

const SpeakerSegmentSchema = new mongoose.Schema(
  {
    speaker: {
      type: String,
      enum: ['C', 'R', 'U'], // C: Customer, R: Representative, U: Unknown
      default: 'U',
    },
    speakerLabel: {
      type: String,
      default: 'Speaker',
    },
    text: {
      type: String,
      required: true,
    },
    originalText: {
      type: String,
      default: '',
    },
    languageDetected: {
      type: String,
      default: 'en',
    },
    timestamp: {
      type: Number, // Seconds into audio
      default: 0,
    },
    confidence: {
      type: Number,
      default: 0.95,
    },
  },
  { _id: false }
);

const RecordingSchema = new mongoose.Schema(
  {
    recordingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    storeId: {
      type: String,
      required: true,
      index: true,
    },
    storeName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
      default: () => `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    representativeName: {
      type: String,
      default: 'Alex Rivers',
    },
    startTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['live', 'completed', 'ended', 'interrupted'],
      default: 'live',
      index: true,
    },
    audioUrl: {
      type: String,
      default: '',
    },
    audioPath: {
      type: String,
      default: '',
    },
    audioMimeType: {
      type: String,
      default: 'audio/webm',
    },
    fullTranscript: {
      type: String,
      default: '',
    },
    originalLanguage: {
      type: String,
      enum: ['en', 'es', 'bilingual'],
      default: 'en',
    },
    translatedTranscriptEn: {
      type: String,
      default: '',
    },
    speakerSegments: [SpeakerSegmentSchema],
    aiAnalysis: {
      analyzed: {
        type: Boolean,
        default: false,
        index: true,
      },
      analyzedAt: {
        type: Date,
        default: null,
      },
      summary: {
        type: String,
        default: '',
      },
      customerNeeds: {
        type: String,
        default: '',
      },
      customerSentiment: {
        type: String,
        enum: ['Positive', 'Neutral', 'Negative'],
        default: 'Neutral',
      },
      sentimentScore: {
        type: Number, // 0 to 100
        default: 75,
      },
      productsDiscussed: [{ type: String }],
      opportunityType: {
        type: String,
        enum: [
          'Closed Won',
          'Closed Lost',
          'Upsell Missed',
          'Accessory Missed',
          'Inquiry / Consultation',
          'Warranty Missed',
          'Trade-in Opportunity',
          'Follow-up Needed',
        ],
        default: 'Inquiry / Consultation',
      },
      missedOpportunity: {
        detected: {
          type: Boolean,
          default: false,
        },
        category: {
          type: String,
          default: 'None', // e.g. "Charger", "Protective Case", "Warranty", "Phone model"
        },
        details: {
          type: String,
          default: '',
        },
        estimatedLoss: {
          type: Number,
          default: 0,
        },
      },
      salesOutcome: {
        type: String,
        enum: ['Sold', 'Missed', 'Consultation'],
        default: 'Consultation',
      },
      saleAmount: {
        type: Number,
        default: 0,
      },
      itemsSold: {
        type: Number,
        default: 0,
      },
      coachingTip: {
        type: String,
        default: '',
      },
      performanceScore: {
        type: Number, // 1 - 10
        default: 8,
      },
      lowStockMentioned: {
        type: Boolean,
        default: false,
      },
      redactedItemsCount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Recording', RecordingSchema);
