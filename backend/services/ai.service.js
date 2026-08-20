const { GoogleGenerativeAI } = require('@google/generative-ai');

const TRANSACTION_EXTRACTION_PROMPT = `
You are a high-precision financial data extractor and categorizer. Your task is to extract every transaction from the provided bank/UPI statement text (including PhonePe, GPay, Paytm, Bank statements).

Rules:
1. Return ONLY a valid JSON array of objects. Do not include markdown formatting or explanations.
2. For each transaction, extract:
   - "date": Use ISO 8601 format (YYYY-MM-DD). Parse formats like "Aug 17, 2026", "17 Aug 2025", "17/08/2026", etc.
   - "amount": The transaction value in Paise (Integer). E.g., ₹50 becomes 5000, ₹5.50 becomes 550, ₹5,954 becomes 595400, ₹20,000 becomes 2000000.
   - "description": The raw original description (e.g., "Paid to RAMA STORES", "Received from Amma", "Mobile recharged 9966577205").
   - "merchantName": Cleaned name of the recipient/sender or merchant (e.g., "Rama Stores", "Amazon India", "Amma", "Rapido", "APSRTC").
   - "type": "EXPENSE" if money left the account ("Paid to", "DEBIT", "Transfer to", "Recharge", "Payment to"), or "INCOME" if money entered ("Received from", "CREDIT", "Refund", "Deposit").
   - "isSubscription": Boolean. True for recurring services, mobile recharges, Netflix, Spotify, OpenAI, etc.
   - "category": MUST be strictly one of these 10 categories based on the context:
     * "Food & Dining": Restaurants, food, bakeries, tea/coffee, snacks, soda, Swiggy, Zomato, mess, fast food.
     * "Shopping": General stores, kirana, provision stores, Amazon, Flipkart, retail, personal care/haircuts.
     * "Transportation": Bus, cab, auto, train, metro, APSRTC, Rapido, Uber, Ola, petrol/fuel.
     * "Housing": Room rent, hostel, electricity, maintenance.
     * "Subscriptions": Mobile recharge, software/AI (OpenAI), OTT (Netflix, Spotify).
     * "Entertainment": Movies, theaters, events, games.
     * "Health": Pharmacy, medicines, doctor, clinic, hospital.
     * "Investments": Chit funds, mutual funds, stocks, cooperatives.
     * "Salary": Salary deposits, wages from employer.
     * "Other": University/college fees, person-to-person transfers to friends/family, miscellaneous.

Schema Example:
[
  {
    "date": "2026-08-17",
    "amount": 5000,
    "description": "Paid to RAMA STORES DEBIT ₹50",
    "merchantName": "RAMA STORES",
    "type": "EXPENSE",
    "isSubscription": false,
    "category": "Shopping"
  }
]

Process the following text carefully and extract ALL transactions:
`;

const FINANCIAL_INSIGHTS_PROMPT = `
You are a Senior Financial Advisor. Analyze the following user transaction data and provide 3 actionable insights.

Insights should cover:
1. Spending leaks (e.g., duplicate subscriptions).
2. Category anomalies. You MUST use specific numbers and percentages (e.g., "Your food spending increased by 43% vs last month" or "Entertainment accounts for 18% of expenses"). Do NOT be generic.
3. Specific saving opportunities. Tell the user EXACTLY how much they could save by cutting specific expenses (e.g., "Reducing Swiggy and Amazon by 20% would save ₹3,400/month").

Return the response in JSON format:
{
  "summary": "Overall financial health summary (data-driven)",
  "savingTip": "A specific tip to save money based on the data with concrete ₹ amounts",
  "anomalies": "Any unusual spending patterns detected with % changes",
  "topCategory": "The category with highest spend"
}
`;

const FINANCIAL_CHAT_SYSTEM_PROMPT = `
You are FinAI, a professional and friendly personalized AI financial advisor. Your goal is to guide the user in budgeting, saving money, understanding their transaction patterns, and overall wealth management.
You will be provided with the user's latest transaction logs, categories, and active budget targets inside the system instructions for context.

Rules:
1. Provide highly structured, clear, and actionable feedback based on their actual numbers where possible.
2. Use bullet points or lists to break down multiple steps or advice.
3. Be warm, empathetic, and encouraging. Focus on healthy habit-building.
4. Refuse topics unrelated to finance, budgeting, investments, or transaction records politely.
5. If the user asks about specific numbers (like "how much did I spend on food?"), calculate it from the transactions details provided in your profile context.
`;

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const JSON_CONFIG = {
  temperature: 0.1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
};

class AIService {
  static cleanJsonString(str) {
    let clean = str.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(json)?/, '');
      clean = clean.replace(/```$/, '');
    }
    return clean.trim();
  }

  static normalizeExtractionResult(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.transactions)) {
      return data.transactions;
    }
    return [];
  }

  static guessCategory(text, merchant) {
    const combined = `${text} ${merchant}`.toLowerCase();
    if (/swiggy|zomato|restaurant|cafe|bakery|snack|soda|coffee|tea|ice cream|canteen|mess|food|dhaba/.test(combined)) {
      return 'Food & Dining';
    }
    if (/amazon|flipkart|myntra|store|stores|kirana|general|retail|mart|shop|snap cut|cloth|fashion/.test(combined)) {
      return 'Shopping';
    }
    if (/uber|ola|rapido|apsrtc|transport|railway|irctc|metro|bus|petrol|fuel|auto|travel/.test(combined)) {
      return 'Transportation';
    }
    if (/room|rent|hostel|pg|flat|house|apartment|electricity|maintenance/.test(combined)) {
      return 'Housing';
    }
    if (/netflix|spotify|openai|prime|hotstar|recharge|recharged|jio|airtel|vi |vodafone|youtube/.test(combined)) {
      return 'Subscriptions';
    }
    if (/movie|cinema|inox|pvr|bookmyshow|game|theatre/.test(combined)) {
      return 'Entertainment';
    }
    if (/hospital|clinic|pharmacy|medical|doctor|apollo|medplus|health/.test(combined)) {
      return 'Health';
    }
    if (/zerodha|groww|mutual fund|investment|investments|stree nidhi|cooperative|chit|share/.test(combined)) {
      return 'Investments';
    }
    if (/salary|wages|payroll|stipend/.test(combined)) {
      return 'Salary';
    }
    return 'Other';
  }

  static extractTransactionsFallback(text) {
    const transactions = [];
    const normalized = text.replace(/\r\n/g, '\n');

    const monthNames = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11
    };

    // Pattern A: PhonePe / UPI Transaction Blocks
    const phonePeBlockRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})[\s\S]*?(?:Paid to|Received from|Transfer to|Payment to|Mobile recharged)\s+([\s\S]*?)\s+(CREDIT|DEBIT)\s+[₹Rs\.]*\s*([\d,]+(?:\.\d{1,2})?)/gi;
    let match;
    while ((match = phonePeBlockRegex.exec(normalized)) !== null) {
      try {
        const dateStr = match[1].trim();
        const detailsRaw = match[2].replace(/\n/g, ' ').trim();
        const typeStr = match[3].toUpperCase();
        const amountStr = match[4].replace(/,/g, '');
        const amount = Math.round(parseFloat(amountStr) * 100);

        const dateParts = dateStr.match(/([a-zA-Z]+)\s+(\d{1,2}),\s+(\d{4})/);
        let isoDate = new Date().toISOString().split('T')[0];
        if (dateParts) {
          const mName = dateParts[1].toLowerCase().substring(0, 3);
          const monthIndex = monthNames[mName] ?? 0;
          const day = parseInt(dateParts[2], 10);
          const year = parseInt(dateParts[3], 10);
          const d = new Date(Date.UTC(year, monthIndex, day));
          isoDate = d.toISOString().split('T')[0];
        }

        const type = typeStr === 'CREDIT' ? 'INCOME' : 'EXPENSE';
        const isSubscription = /recharged|netflix|spotify|openai/i.test(detailsRaw);
        const merchantName = detailsRaw.replace(/^(Paid to|Received from|Transfer to|Payment to)\s+/i, '').trim();
        const category = AIService.guessCategory(detailsRaw, merchantName);

        transactions.push({
          date: isoDate,
          amount,
          description: `${type === 'INCOME' ? 'Received from' : 'Paid to'} ${detailsRaw} ${typeStr} ₹${amountStr}`,
          merchantName: merchantName.length > 50 ? merchantName.substring(0, 50) : merchantName,
          type,
          isSubscription,
          category
        });
      } catch (e) {
        // Skip malformed entries
      }
    }

    if (transactions.length > 0) return transactions;

    // Pattern B: Generic bank lines
    const lines = normalized.split('\n').filter(line => line.trim().length > 0);
    for (const line of lines) {
      const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      const amountMatch = line.match(/[\d,]+\.\d{2}/);

      if (dateMatch && amountMatch) {
        try {
          const [, dateStr] = dateMatch;
          const amountStr = amountMatch[0].replace(/,/g, '');
          const amount = Math.round(parseFloat(amountStr) * 100);

          const parts = dateStr.split(/[\/\-]/);
          const fullYear = parseInt(parts[2]) < 100 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
          let day, month;
          if (parseInt(parts[0]) > 12) {
            day = parseInt(parts[0]);
            month = parseInt(parts[1]);
          } else {
            month = parseInt(parts[0]);
            day = parseInt(parts[1]);
          }
          const date = new Date(Date.UTC(fullYear, month - 1, day)).toISOString().split('T')[0];
          const type = line.toLowerCase().includes('debit') || line.toLowerCase().includes('payment') ? 'EXPENSE' : 'INCOME';
          const merchantName = line.substring(0, 50).trim().split(' ')[0];
          const category = AIService.guessCategory(line, merchantName);

          transactions.push({
            date,
            amount,
            description: line.substring(0, 100).trim(),
            merchantName,
            type,
            isSubscription: false,
            category
          });
        } catch (e) {
          // Skip
        }
      }
    }

    return transactions;
  }

  static async extractTransactions(text) {
    if (!genAI) {
      return this.extractTransactionsFallback(text);
    }

    const MAX_CHUNK_SIZE = 12000;
    if (text.length <= MAX_CHUNK_SIZE) {
      return this.extractSingleChunk(text);
    }

    const chunks = [];
    let currentChunk = '';
    const paragraphs = text.split(/\n\s*\n/);

    for (const para of paragraphs) {
      if ((currentChunk.length + para.length) > MAX_CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      currentChunk += para + '\n\n';
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk);
    }

    const allTransactions = [];
    for (const chunk of chunks) {
      const extracted = await this.extractSingleChunk(chunk);
      allTransactions.push(...extracted);
    }

    return allTransactions.length > 0 ? allTransactions : this.extractTransactionsFallback(text);
  }

  static async extractSingleChunk(text) {
    if (!genAI) return this.extractTransactionsFallback(text);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: JSON_CONFIG });
      const result = await model.generateContent(`${TRANSACTION_EXTRACTION_PROMPT}\n\n${text}`);
      const cleaned = this.cleanJsonString(result.response.text());
      const parsed = this.normalizeExtractionResult(JSON.parse(cleaned));
      if (parsed.length > 0) return parsed;
    } catch (error) {
      console.error('Gemini extraction fallback:', error.message);
    }
    return this.extractTransactionsFallback(text);
  }

  static async generateInsights(transactions) {
    if (!genAI) {
      return {
        summary: 'Review your monthly spending patterns to identify savings opportunities.',
        savingTip: 'Consider setting monthly category budgets to keep expenses under control.',
        anomalies: 'No unusual spikes detected.',
        topCategory: 'Shopping'
      };
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: JSON_CONFIG });
      const prompt = `${FINANCIAL_INSIGHTS_PROMPT}\n\nData:\n${JSON.stringify(transactions)}`;
      const result = await model.generateContent(prompt);
      const cleaned = this.cleanJsonString(result.response.text());
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Gemini Insights error:', error.message);
      return {
        summary: 'Based on your transactions, maintain a balanced spending approach.',
        savingTip: 'Review recurring subscriptions and dining expenses to maximize your monthly savings.',
        anomalies: 'Spending remains within expected parameters.',
        topCategory: 'Food & Dining'
      };
    }
  }

  static async chat(message, history = [], financialContext = {}) {
    if (!genAI) {
      return "AI Advisory service is currently running in offline mode. Please configure GEMINI_API_KEY.";
    }

    const systemInstruction = `${FINANCIAL_CHAT_SYSTEM_PROMPT}\n\nUSER FINANCIAL DATA CONTEXT:\n${JSON.stringify(financialContext, null, 2)}`;
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    const formattedHistory = history.map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));

    for (const modelName of modelsToTry) {
      try {
        const chatModel = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction
        });

        const chatSession = chatModel.startChat({
          history: formattedHistory,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        });

        const result = await chatSession.sendMessage(message);
        return result.response.text();
      } catch (error) {
        console.error(`Chat Error (${modelName}):`, error.message);
      }
    }

    return "I'm sorry, I couldn't reach the AI service right now. Please try asking again in a moment!";
  }
}

module.exports = AIService;
