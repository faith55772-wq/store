const mongoose = require('mongoose');
const AdminUser = require('./models/AdminUser');
const Store = require('./models/Store');
const Recording = require('./models/Recording');
const DailyReport = require('./models/DailyReport');
const { generateDailyReport } = require('./services/dailyReportService');
require('dotenv').config();

const connectDB = require('./config/db');

async function seedData() {
  await connectDB();
  console.log('[Seed] Seeding realistic data for Store Listener...');

  // 1. Admin User
  await AdminUser.deleteMany({});
  const admin = await AdminUser.create({
    email: 'admin@storelistener.ai',
    password: 'admin123',
    name: 'Chief Admin Officer',
    role: 'super_admin',
  });
  console.log('[Seed] Admin user created:', admin.email);

  // 2. Sample Stores
  await Store.deleteMany({});
  const stores = await Store.create([
    {
      storeId: 'STORE-101',
      name: 'Dallas Downtown Retail #104',
      location: 'Dallas, TX',
      address: '1400 Main Street, Suite 2B',
      contactPerson: 'Marcus Vance',
      email: 'marcus@dallasstore.com',
      phone: '+1 (214) 555-0192',
      status: 'approved',
      isRecording: true,
      systemInfo: {
        hostname: 'POS-TERMINAL-01',
        os: 'Windows 11 Pro',
        activeMic: 'USB Omnidirectional Conference Mic (Realtek High Definition)',
        availableMics: [
          'USB Omnidirectional Conference Mic (Realtek High Definition)',
          'Built-in Microphone Array (Intel Smart Sound)',
        ],
        clientVersion: '1.2.9',
      },
      lastSeenAt: new Date(),
      approvedAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      storeId: 'STORE-102',
      name: 'Houston Galleria Store #208',
      location: 'Houston, TX',
      address: '5085 Westheimer Rd',
      contactPerson: 'Elena Rodriguez',
      email: 'elena@houstonstore.com',
      phone: '+1 (713) 555-0144',
      status: 'approved',
      isRecording: false,
      systemInfo: {
        hostname: 'GALLERIA-POS-A',
        os: 'Windows 10 Enterprise',
        activeMic: 'Jabra Speak 710 Mic',
        availableMics: ['Jabra Speak 710 Mic', 'Default Device'],
        clientVersion: '1.2.9',
      },
      lastSeenAt: new Date(Date.now() - 3600000),
      approvedAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      storeId: 'STORE-103',
      name: 'Austin Domain Tech Store #312',
      location: 'Austin, TX',
      address: '11410 Century Oaks Terrace',
      contactPerson: 'Julian Chen',
      email: 'julian@austinstore.com',
      phone: '+1 (512) 555-0188',
      status: 'pending', // Pending store for testing the Store Approvals Module!
      isRecording: false,
      systemInfo: {
        hostname: 'DOMAIN-DESKTOP-CLIENT',
        os: 'Windows 11',
        activeMic: 'Rode Wireless GO II Mic',
        availableMics: ['Rode Wireless GO II Mic', 'Internal Microphone'],
        clientVersion: '1.2.9',
      },
      lastSeenAt: new Date(),
      approvedAt: null,
    },
  ]);
  console.log(`[Seed] Seeded ${stores.length} stores (including STORE-103 as pending approval).`);

  // 3. Sample Recordings
  await Recording.deleteMany({});
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const sampleRecordingsData = [
    {
      recordingId: 'REC-2026-001',
      storeId: 'STORE-101',
      storeName: 'Dallas Downtown Retail #104',
      location: 'Dallas, TX',
      customerId: 'CUST-8492',
      representativeName: 'Alex Rivers',
      startTime: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
      endTime: new Date(Date.now() - 1000 * 60 * 178),
      durationSeconds: 120,
      status: 'completed',
      originalLanguage: 'en',
      fullTranscript:
        'Hello welcome to StoreAI retail how can I help you today? Hi I am looking for the new iPhone 15 Pro Max with 256GB in Natural Titanium. Excellent choice we actually have that in stock right now for $1,199. Awesome I will take it! Here is my card. Thank you so much, here is your receipt and congratulations on your new phone!',
      translatedTranscriptEn:
        'Hello welcome to StoreAI retail how can I help you today? Hi I am looking for the new iPhone 15 Pro Max with 256GB in Natural Titanium. Excellent choice we actually have that in stock right now for $1,199. Awesome I will take it! Here is my card. Thank you so much, here is your receipt and congratulations on your new phone!',
      speakerSegments: [
        {
          speaker: 'R',
          speakerLabel: 'Representative',
          text: 'Hello welcome to StoreAI retail how can I help you today?',
          timestamp: 0,
          confidence: 0.98,
        },
        {
          speaker: 'C',
          speakerLabel: 'Customer',
          text: 'Hi I am looking for the new iPhone 15 Pro Max with 256GB in Natural Titanium.',
          timestamp: 5,
          confidence: 0.96,
        },
        {
          speaker: 'R',
          speakerLabel: 'Representative',
          text: 'Excellent choice we actually have that in stock right now for $1,199.',
          timestamp: 12,
          confidence: 0.99,
        },
        {
          speaker: 'C',
          speakerLabel: 'Customer',
          text: 'Awesome I will take it! Here is my card.',
          timestamp: 20,
          confidence: 0.97,
        },
        {
          speaker: 'R',
          speakerLabel: 'Representative',
          text: 'Thank you so much, here is your receipt and congratulations on your new phone!',
          timestamp: 28,
          confidence: 0.98,
        },
      ],
      aiAnalysis: {
        analyzed: true,
        analyzedAt: new Date(),
        summary:
          'Customer purchased iPhone 15 Pro Max for $1,199. Sale closed quickly, but representative missed bundling a 30W fast charger.',
        customerNeeds: 'Looking for flagship smartphone in titanium finish with immediate availability.',
        customerSentiment: 'Positive',
        sentimentScore: 92,
        productsDiscussed: ['iPhone 15 Pro Max'],
        opportunityType: 'Upsell Missed',
        missedOpportunity: {
          detected: true,
          category: 'Charger',
          details:
            'Representative did not pitch a 30W USB-C fast charging adapter. New iPhones ship without a power adapter.',
          estimatedLoss: 35,
        },
        salesOutcome: 'Sold',
        saleAmount: 1199,
        itemsSold: 1,
        coachingTip:
          'Great closing speed, but always ask: "Do you have a 30W USB-C wall charger at home for fast charging?" before tendering payment.',
        performanceScore: 8,
        lowStockMentioned: false,
        redactedItemsCount: 1,
      },
    },
    {
      recordingId: 'REC-2026-002',
      storeId: 'STORE-101',
      storeName: 'Dallas Downtown Retail #104',
      location: 'Dallas, TX',
      customerId: 'CUST-3910',
      representativeName: 'Alex Rivers',
      startTime: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      endTime: new Date(Date.now() - 1000 * 60 * 118),
      durationSeconds: 95,
      status: 'completed',
      originalLanguage: 'es', // Bilingual Spanish interaction translated into English
      fullTranscript:
        'Buenas tardes, tienen cargadores para iPhone 15? Sí claro, tenemos el cargador rápido de 30 vatios por veinticinco dólares. ¿Tiene algún descuento? No, el precio es fijo. Ah está muy caro, lo compraré por internet después. Gracias.',
      translatedTranscriptEn:
        'Good afternoon, do you have chargers for iPhone 15? Yes of course, we have the 30W fast charger for twenty-five dollars. Do you have any discount? No, the price is fixed. Oh it is too expensive, I will buy it online later. Thanks.',
      speakerSegments: [
        {
          speaker: 'C',
          speakerLabel: 'Customer',
          text: 'Good afternoon, do you have chargers for iPhone 15?',
          originalText: 'Buenas tardes, tienen cargadores para iPhone 15?',
          languageDetected: 'es',
          timestamp: 0,
          confidence: 0.95,
        },
        {
          speaker: 'R',
          speakerLabel: 'Representative',
          text: 'Yes of course, we have the 30W fast charger for twenty-five dollars.',
          originalText: 'Sí claro, tenemos el cargador rápido de 30 vatios por veinticinco dólares.',
          languageDetected: 'es',
          timestamp: 6,
          confidence: 0.97,
        },
        {
          speaker: 'C',
          speakerLabel: 'Customer',
          text: 'Do you have any discount?',
          originalText: '¿Tiene algún descuento?',
          languageDetected: 'es',
          timestamp: 14,
          confidence: 0.96,
        },
        {
          speaker: 'R',
          speakerLabel: 'Representative',
          text: 'No, the price is fixed.',
          originalText: 'No, el precio es fijo.',
          languageDetected: 'es',
          timestamp: 19,
          confidence: 0.98,
        },
        {
          speaker: 'C',
          speakerLabel: 'Customer',
          text: 'Oh it is too expensive, I will buy it online later. Thanks.',
          originalText: 'Ah está muy caro, lo compraré por internet después. Gracias.',
          languageDetected: 'es',
          timestamp: 25,
          confidence: 0.94,
        },
      ],
      aiAnalysis: {
        analyzed: true,
        analyzedAt: new Date(),
        summary:
          'Spanish speaking customer asked for 30W iPhone charger. Staff flatly refused discount leading to customer walkout.',
        customerNeeds: 'Needs high speed charging block for recently acquired smartphone, budget conscious.',
        customerSentiment: 'Negative',
        sentimentScore: 42,
        productsDiscussed: ['30W Fast Charger'],
        opportunityType: 'Closed Lost',
        missedOpportunity: {
          detected: true,
          category: 'Charger',
          details:
            'Representative gave a blunt refusal without offering bundle incentives or store coupon, losing a $25 accessory sale.',
          estimatedLoss: 25,
        },
        salesOutcome: 'Missed',
        saleAmount: 0,
        itemsSold: 0,
        coachingTip:
          'Avoid hard "No". Instead offer: "While the adapter is $25, if you bundle with a cable or screen protector I can give you 10% off the bundle."',
        performanceScore: 5,
        lowStockMentioned: false,
        redactedItemsCount: 0,
      },
    },
    {
      recordingId: 'REC-2026-003',
      storeId: 'STORE-102',
      storeName: 'Houston Galleria Store #208',
      location: 'Houston, TX',
      customerId: 'CUST-5511',
      representativeName: 'Elena Rodriguez',
      startTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      endTime: new Date(Date.now() - 1000 * 60 * 58),
      durationSeconds: 140,
      status: 'completed',
      originalLanguage: 'en',
      fullTranscript:
        'Hi welcome to Galleria store! Hi do you have Samsung Galaxy S24 Ultra in 512GB Titanium Black? Let me check our inventory... Oh unfortunately that model is out of stock until Friday. Would you like to check the 256GB? No I really need 512GB for work video storage. Okay no problem, have a good day.',
      translatedTranscriptEn:
        'Hi welcome to Galleria store! Hi do you have Samsung Galaxy S24 Ultra in 512GB Titanium Black? Let me check our inventory... Oh unfortunately that model is out of stock until Friday. Would you like to check the 256GB? No I really need 512GB for work video storage. Okay no problem, have a good day.',
      speakerSegments: [
        {
          speaker: 'R',
          speakerLabel: 'Representative',
          text: 'Hi welcome to Galleria store!',
          timestamp: 0,
          confidence: 0.98,
        },
        {
          speaker: 'C',
          speakerLabel: 'Customer',
          text: 'Hi do you have Samsung Galaxy S24 Ultra in 512GB Titanium Black?',
          timestamp: 4,
          confidence: 0.97,
        },
        {
          speaker: 'R',
          speakerLabel: 'Representative',
          text: 'Let me check our inventory... Oh unfortunately that model is out of stock until Friday. Would you like to check the 256GB?',
          timestamp: 11,
          confidence: 0.95,
        },
        {
          speaker: 'C',
          speakerLabel: 'Customer',
          text: 'No I really need 512GB for work video storage.',
          timestamp: 22,
          confidence: 0.98,
        },
        {
          speaker: 'R',
          speakerLabel: 'Representative',
          text: 'Okay no problem, have a good day.',
          timestamp: 28,
          confidence: 0.97,
        },
      ],
      aiAnalysis: {
        analyzed: true,
        analyzedAt: new Date(),
        summary:
          'Customer inquired about Samsung S24 Ultra 512GB. Item was out of stock and representative failed to hold customer contact or offer direct shipping.',
        customerNeeds: 'Professional videographer requiring high internal storage device immediately.',
        customerSentiment: 'Neutral',
        sentimentScore: 60,
        productsDiscussed: ['Samsung Galaxy S24 Ultra'],
        opportunityType: 'Closed Lost',
        missedOpportunity: {
          detected: true,
          category: 'Phone models',
          details:
            'Lost a $1,419 device sale because store had no stock and representative did not offer free home delivery from central warehouse.',
          estimatedLoss: 1419,
        },
        salesOutcome: 'Missed',
        saleAmount: 0,
        itemsSold: 0,
        coachingTip:
          'Never let an out-of-stock customer leave empty handed. Offer: "I can order it right now with free next-day home delivery."',
        performanceScore: 6,
        lowStockMentioned: true,
        redactedItemsCount: 0,
      },
    },
    {
      recordingId: 'REC-2026-004',
      storeId: 'STORE-101',
      storeName: 'Dallas Downtown Retail #104',
      location: 'Dallas, TX',
      customerId: 'CUST-7720',
      representativeName: 'Alex Rivers',
      startTime: new Date(Date.now() - 1000 * 60 * 20), // 20 mins ago
      endTime: new Date(Date.now() - 1000 * 60 * 18),
      durationSeconds: 88,
      status: 'completed',
      originalLanguage: 'en',
      fullTranscript:
        'Hi, I need a rugged protective case and screen protector for iPhone 15. We have the MagSafe armor case for $45 and our 9H tempered glass protector for $25. Can you install the glass for me? Absolutely, we install it with our zero-dust alignment tool for free. Perfect, ring me up! That will be $70 total.',
      translatedTranscriptEn:
        'Hi, I need a rugged protective case and screen protector for iPhone 15. We have the MagSafe armor case for $45 and our 9H tempered glass protector for $25. Can you install the glass for me? Absolutely, we install it with our zero-dust alignment tool for free. Perfect, ring me up! That will be $70 total.',
      speakerSegments: [
        {
          speaker: 'C',
          speakerLabel: 'Customer',
          text: 'Hi, I need a rugged protective case and screen protector for iPhone 15.',
          timestamp: 0,
          confidence: 0.98,
        },
        {
          speaker: 'R',
          speakerLabel: 'Representative',
          text: 'We have the MagSafe armor case for $45 and our 9H tempered glass protector for $25.',
          timestamp: 6,
          confidence: 0.97,
        },
        {
          speaker: 'C',
          speakerLabel: 'Customer',
          text: 'Can you install the glass for me?',
          timestamp: 14,
          confidence: 0.96,
        },
        {
          speaker: 'R',
          speakerLabel: 'Representative',
          text: 'Absolutely, we install it with our zero-dust alignment tool for free.',
          timestamp: 18,
          confidence: 0.99,
        },
        {
          speaker: 'C',
          speakerLabel: 'Customer',
          text: 'Perfect, ring me up! That will be $70 total.',
          timestamp: 25,
          confidence: 0.98,
        },
      ],
      aiAnalysis: {
        analyzed: true,
        analyzedAt: new Date(),
        summary:
          'Customer purchased MagSafe protective case and tempered screen protector with complimentary in-store installation for $70.',
        customerNeeds: 'Drop protection and professional installation for daily device safety.',
        customerSentiment: 'Positive',
        sentimentScore: 95,
        productsDiscussed: ['MagSafe Protective Case', 'Tempered Screen Protector'],
        opportunityType: 'Closed Won',
        missedOpportunity: {
          detected: false,
          category: 'None',
          details: '',
          estimatedLoss: 0,
        },
        salesOutcome: 'Sold',
        saleAmount: 70,
        itemsSold: 2,
        coachingTip:
          'Flawless service delivery. Offering free glass installation is the best way to secure high-margin accessory sales.',
        performanceScore: 10,
        lowStockMentioned: false,
        redactedItemsCount: 0,
      },
    },
  ];

  await Recording.insertMany(sampleRecordingsData);
  console.log(`[Seed] Seeded ${sampleRecordingsData.length} rich recordings with full single-audio AI analysis.`);

  // 4. Generate Daily Report for today
  await DailyReport.deleteMany({});
  await generateDailyReport(todayStr, 'all');
  await generateDailyReport(todayStr, 'STORE-101');
  console.log(`[Seed] Generated Daily Reports for ${todayStr}.`);

  console.log('[Seed] Database seeding completed successfully!');
  process.exit(0);
}

seedData().catch((err) => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});
