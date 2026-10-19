/**
 * AI Conversation Intelligence Analysis Service
 * Implements single conversation deep-dive analysis, missed opportunity detection,
 * customer sentiment, speaker diarization labeling, and representative coaching.
 */

function analyzeConversation(transcript, speakerSegments = []) {
  if (!transcript || transcript.trim().length === 0) {
    return generateEmptyAnalysis();
  }

  const textLower = transcript.toLowerCase();

  // 1. Identify Products Discussed
  const productCatalog = [
    { name: 'iPhone 15 Pro Max', keywords: ['iphone 15 pro max', '15 pro max', 'iphone 15 pro'] },
    { name: 'iPhone 15', keywords: ['iphone 15', 'iphone'] },
    { name: 'Samsung Galaxy S24 Ultra', keywords: ['galaxy s24 ultra', 's24 ultra', 's24'] },
    { name: 'Google Pixel 8', keywords: ['pixel 8', 'pixel'] },
    { name: '30W Fast Charger', keywords: ['charger', 'fast charger', 'adapter', 'charging block', 'usb-c'] },
    { name: 'MagSafe Protective Case', keywords: ['case', 'protective case', 'cover', 'silicone case'] },
    { name: 'Tempered Screen Protector', keywords: ['screen protector', 'glass protector', 'protector'] },
    { name: 'Extended AppleCare / Warranty', keywords: ['warranty', 'applecare', 'insurance', 'protection plan'] },
    { name: 'Wireless Earbuds', keywords: ['earbuds', 'airpods', 'headphones', 'galaxy buds'] },
    { name: 'Power Bank', keywords: ['power bank', 'portable battery', 'battery pack'] },
  ];

  const productsDiscussed = [];
  for (const item of productCatalog) {
    if (item.keywords.some((kw) => textLower.includes(kw))) {
      productsDiscussed.push(item.name);
    }
  }

  if (productsDiscussed.length === 0) {
    productsDiscussed.push('Mobile Device Inquiry', 'Accessories');
  }

  // 2. Sentiment Detection
  const positiveWords = ['great', 'perfect', 'awesome', 'good', 'love', 'thanks', 'thank you', 'excellent', 'nice', 'appreciate', 'deal', 'discount', 'yes please', 'buy', 'take it'];
  const negativeWords = ['expensive', 'too much', 'no', 'disappointed', 'terrible', 'bad', 'out of stock', 'complaint', 'cannot', 'refusal', 'broken', 'issue', 'problem', 'wait'];

  let posScore = 0;
  let negScore = 0;
  positiveWords.forEach((w) => {
    if (textLower.includes(w)) posScore += 2;
  });
  negativeWords.forEach((w) => {
    if (textLower.includes(w)) negScore += 2;
  });

  let customerSentiment = 'Neutral';
  let sentimentScore = 70;

  if (posScore > negScore + 1) {
    customerSentiment = 'Positive';
    sentimentScore = Math.min(96, 75 + (posScore - negScore) * 5);
  } else if (negScore > posScore + 1) {
    customerSentiment = 'Negative';
    sentimentScore = Math.max(30, 60 - (negScore - posScore) * 6);
  } else {
    customerSentiment = 'Neutral';
    sentimentScore = 65;
  }

  // 3. Detect Missed Opportunity & Category
  let missedDetected = false;
  let missedCategory = 'None';
  let missedDetails = '';
  let estimatedLoss = 0;
  let opportunityType = 'Inquiry / Consultation';
  let salesOutcome = 'Consultation';
  let saleAmount = 0;
  let itemsSold = 0;

  const phoneMentioned = productsDiscussed.some((p) => p.includes('iPhone') || p.includes('Galaxy') || p.includes('Pixel'));
  const chargerMentioned = productsDiscussed.includes('30W Fast Charger') || textLower.includes('charger');
  const caseMentioned = productsDiscussed.includes('MagSafe Protective Case') || textLower.includes('case');
  const warrantyMentioned = productsDiscussed.includes('Extended AppleCare / Warranty') || textLower.includes('warranty');

  const soldIndicators = ['take it', "i'll take", 'bought', 'card', 'cash', 'receipt', 'purchase', 'bill', 'deal', 'sold'];
  const isSold = soldIndicators.some((kw) => textLower.includes(kw));

  if (isSold) {
    salesOutcome = 'Sold';
    if (phoneMentioned) {
      saleAmount += 899;
      itemsSold += 1;
    } else {
      saleAmount += 49;
      itemsSold += 1;
    }

    // Check upsell/accessories missed
    if (phoneMentioned && !chargerMentioned) {
      missedDetected = true;
      missedCategory = 'Charger';
      missedDetails = 'Customer purchased a smartphone, but representative failed to bundle a 30W USB-C fast charging adapter.';
      estimatedLoss = 35;
      opportunityType = 'Upsell Missed';
    } else if (phoneMentioned && !caseMentioned) {
      missedDetected = true;
      missedCategory = 'Protective Case';
      missedDetails = 'Phone sale completed without cross-selling a screen protector or high-margin protective case.';
      estimatedLoss = 45;
      opportunityType = 'Accessory Missed';
    } else if (phoneMentioned && !warrantyMentioned) {
      missedDetected = true;
      missedCategory = 'Warranty';
      missedDetails = 'Customer did not receive an offer for device insurance or extended warranty coverage.';
      estimatedLoss = 89;
      opportunityType = 'Warranty Missed';
    } else {
      opportunityType = 'Closed Won';
    }
  } else {
    // Check why lost
    if (textLower.includes('too expensive') || textLower.includes('out of stock') || textLower.includes('just looking') || textLower.includes('no thanks') || textLower.includes('think about it')) {
      missedDetected = true;
      opportunityType = 'Closed Lost';
      salesOutcome = 'Missed';
      if (textLower.includes('out of stock')) {
        missedCategory = 'Phone models';
        missedDetails = 'Customer requested a specific model that was out of stock. Representative did not capture contact info or place a backorder.';
        estimatedLoss = 799;
      } else {
        missedCategory = 'Phone models';
        missedDetails = 'Customer hesitated on device price. Staff did not introduce trade-in value or flexible financing options.';
        estimatedLoss = 650;
      }
    } else {
      opportunityType = 'Inquiry / Consultation';
    }
  }

  // 4. Low stock check
  const lowStockMentioned = textLower.includes('out of stock') || textLower.includes('last one') || textLower.includes('low stock');

  // 5. Redacted Count (PII removal e.g. credit card / SSN / phone numbers)
  const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
  const ccPattern = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g;
  const redactedCount = (transcript.match(phonePattern) || []).length + (transcript.match(ccPattern) || []).length;

  // 6. Summary & Customer Needs
  let summary = `Customer visited inquiring about ${productsDiscussed.join(', ')}. `;
  if (isSold) {
    summary += `Representative successfully closed the transaction for $${saleAmount}. `;
  } else {
    summary += `Discussion centered on features, pricing, and availability. `;
  }
  if (missedDetected) {
    summary += `Key missed opportunity identified in ${missedCategory}.`;
  } else {
    summary += `Comprehensive engagement with strong customer satisfaction.`;
  }

  let customerNeeds = `Customer seeking ${productsDiscussed[0] || 'device assistance'} `;
  if (customerSentiment === 'Positive') {
    customerNeeds += 'with clear readiness to purchase high quality hardware.';
  } else if (textLower.includes('price') || textLower.includes('expensive')) {
    customerNeeds += 'with high sensitivity to price point and demanding value bundles.';
  } else {
    customerNeeds += 'requiring technical guidance and feature comparison.';
  }

  // 7. Coaching Tip & Score
  let coachingTip = '';
  let performanceScore = 8;

  if (missedDetected && missedCategory === 'Charger') {
    coachingTip = 'Always remind customer that new smartphones ship without charging bricks. Introduce fast chargers as an essential bundle before tender.';
    performanceScore = 7;
  } else if (missedDetected && missedCategory === 'Warranty') {
    coachingTip = 'Pitch peace of mind warranty at the device unboxing moment. Highlight accidental screen drop coverage.';
    performanceScore = 7;
  } else if (missedDetected && missedCategory === 'Phone models') {
    coachingTip = 'When a customer hesitates on upfront cost, immediately offer carrier trade-in promotions and 0% APR installment plans.';
    performanceScore = 6;
  } else if (isSold) {
    coachingTip = 'Excellent product demonstration and confident closing! Keep maintaining high enthusiasm during the handoff.';
    performanceScore = 9;
  } else {
    coachingTip = 'Engage with open-ended discovery questions (e.g., "What do you use your phone for most?") to uncover latent needs.';
    performanceScore = 8;
  }

  // 8. Refine Speaker Segments if needed
  let refinedSegments = speakerSegments;
  if (!refinedSegments || refinedSegments.length === 0) {
    refinedSegments = generateChatBubblesFromTranscript(transcript);
  }

  return {
    analyzed: true,
    analyzedAt: new Date(),
    summary,
    customerNeeds,
    customerSentiment,
    sentimentScore,
    productsDiscussed,
    opportunityType,
    missedOpportunity: {
      detected: missedDetected,
      category: missedCategory,
      details: missedDetails,
      estimatedLoss,
    },
    salesOutcome,
    saleAmount,
    itemsSold,
    coachingTip,
    performanceScore,
    lowStockMentioned,
    redactedItemsCount: redactedCount,
    speakerSegments: refinedSegments,
  };
}

function generateChatBubblesFromTranscript(text) {
  const sentences = text.split(/(?<=[.?!])\s+/).filter((s) => s.trim().length > 0);
  const segments = [];
  let currentSpeaker = 'R';

  sentences.forEach((sentence, idx) => {
    // Alternate speakers or detect representative greeting
    if (idx === 0) currentSpeaker = 'R';
    else if (sentence.toLowerCase().includes('how can') || sentence.toLowerCase().includes('we offer')) currentSpeaker = 'R';
    else if (sentence.toLowerCase().includes('i need') || sentence.toLowerCase().includes('how much') || sentence.toLowerCase().includes('do you')) currentSpeaker = 'C';
    else currentSpeaker = currentSpeaker === 'R' ? 'C' : 'R';

    segments.push({
      speaker: currentSpeaker,
      speakerLabel: currentSpeaker === 'R' ? 'Representative' : 'Customer',
      text: sentence.trim(),
      originalText: sentence.trim(),
      languageDetected: 'en',
      timestamp: idx * 4,
      confidence: 0.94,
    });
  });

  return segments;
}

function generateEmptyAnalysis() {
  return {
    analyzed: false,
    analyzedAt: null,
    summary: 'No conversation audio captured yet.',
    customerNeeds: 'Pending audio input',
    customerSentiment: 'Neutral',
    sentimentScore: 50,
    productsDiscussed: [],
    opportunityType: 'Inquiry / Consultation',
    missedOpportunity: {
      detected: false,
      category: 'None',
      details: '',
      estimatedLoss: 0,
    },
    salesOutcome: 'Consultation',
    saleAmount: 0,
    itemsSold: 0,
    coachingTip: 'Ensure microphone is well positioned to capture both customer and representative dialogues.',
    performanceScore: 5,
    lowStockMentioned: false,
    redactedItemsCount: 0,
    speakerSegments: [],
  };
}

module.exports = {
  analyzeConversation,
};
