import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import { TRANSACTION_EXTRACTION_PROMPT, FINANCIAL_INSIGHTS_PROMPT, FINANCIAL_CHAT_SYSTEM_PROMPT } from './prompts';
import { decrypt } from '../utils/encryption';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');

const JSON_CONFIG: GenerationConfig = {
  temperature: 0.1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
};

export class AIService {
  private static model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: JSON_CONFIG 
  });

  private static proModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: JSON_CONFIG
  });

  private static normalizeExtractionResult(data: unknown): any[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as { transactions?: unknown }).transactions)) {
      return (data as { transactions: any[] }).transactions;
    }
    return [];
  }

  private static cleanJsonString(str: string): string {
    let clean = str.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(json)?/, '');
      clean = clean.replace(/```$/, '');
    }
    return clean.trim();
  }

  private static guessCategory(text: string, merchant: string): string {
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

  public static extractTransactionsFallback(text: string) {
    const transactions: any[] = [];
    
    // Normalize newlines
    const normalized = text.replace(/\r\n/g, '\n');

    // 1. PhonePe / UPI multi-line block pattern matching
    // Matches: Date on line, (time), "Paid to / Received from / Mobile recharged ... CREDIT/DEBIT ₹Amount"
    const monthNames: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11
    };

    // Pattern A: PhonePe transaction blocks
    const phonePeBlockRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})[\s\S]*?(?:Paid to|Received from|Transfer to|Payment to|Mobile recharged)\s+([\s\S]*?)\s+(CREDIT|DEBIT)\s+[₹Rs\.]*\s*([\d,]+(?:\.\d{1,2})?)/gi;
    let match;
    while ((match = phonePeBlockRegex.exec(normalized)) !== null) {
      try {
        const dateStr = match[1].trim();
        const detailsRaw = match[2].replace(/\n/g, ' ').trim();
        const typeStr = match[3].toUpperCase();
        const amountStr = match[4].replace(/,/g, '');
        const amount = Math.round(parseFloat(amountStr) * 100);

        // Parse Date "Aug 17, 2026"
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
      } catch {
        // Skip malformed
      }
    }

    if (transactions.length > 0) {
      return transactions;
    }

    // Pattern B: Standard CSV / single-line bank statements (e.g. DD/MM/YYYY ... 123.45)
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
          
          let day: number, month: number;
          if (parseInt(parts[0]) > 12) {
            day = parseInt(parts[0]);
            month = parseInt(parts[1]);
          } else if (parseInt(parts[1]) > 12) {
            month = parseInt(parts[0]);
            day = parseInt(parts[1]);
          } else {
            day = parseInt(parts[0]);
            month = parseInt(parts[1]);
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
        } catch {
          // Skip malformed
        }
      }
    }

    return transactions;
  }

  static async extractTransactions(text: string) {
    // If text is very long (e.g. 20+ page statement), process in manageable chunks of ~6000 chars
    const MAX_CHUNK_SIZE = 12000;
    
    if (text.length <= MAX_CHUNK_SIZE) {
      return this.extractSingleChunk(text);
    }

    // Split text into chunks around page breaks or double newlines
    const chunks: string[] = [];
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

    const allTransactions: any[] = [];
    for (const chunk of chunks) {
      const extracted = await this.extractSingleChunk(chunk);
      allTransactions.push(...extracted);
    }

    return allTransactions.length > 0 ? allTransactions : this.extractTransactionsFallback(text);
  }

  private static async extractSingleChunk(text: string): Promise<any[]> {
    const prompt = `${TRANSACTION_EXTRACTION_PROMPT}\n\n${text}`;
    try {
      const result = await this.model.generateContent(prompt);
      const cleaned = this.cleanJsonString(result.response.text());
      const parsed = this.normalizeExtractionResult(JSON.parse(cleaned));
      if (parsed.length > 0) return parsed;
    } catch (error) {
      console.error('AI Extraction Error on chunk (falling back to parser):', error);
    }
    return this.extractTransactionsFallback(text);
  }

  static async generateInsights(transactions: any[]) {
    const dataStr = JSON.stringify(transactions);
    const prompt = `${FINANCIAL_INSIGHTS_PROMPT}\n\nData:\n${dataStr}`;
    try {
      const result = await this.proModel.generateContent(prompt);
      const cleaned = this.cleanJsonString(result.response.text());
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('AI Insights Error (using fallback):', error);
      return {
        summary: 'Based on your transactions, maintain a balanced spending approach.',
        savingTip: 'Review your subscription services - many people have duplicate or unused subscriptions.',
        anomalies: 'No significant spending anomalies detected this period.',
        topCategory: 'Shopping'
      };
    }
  }

  static async chat(message: string, history: any[], financialContext: any) {
    const systemInstruction = `${FINANCIAL_CHAT_SYSTEM_PROMPT}\n\nUSER FINANCIAL DATA CONTEXT:\n${JSON.stringify(financialContext, null, 2)}`;
    const modelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash'];
    const formattedHistory = history.map((h: any) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));

    for (const modelName of modelsToTry) {
      const chatModel = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction
      });

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
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
        } catch (error: any) {
          const status = error?.status || error?.response?.status;
          const isRetryable = status === 503 || status === 429;
          console.error(`AI Chat Error (model=${modelName}, attempt=${attempt + 1}):`, error?.message || error);
          if (isRetryable && attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1500));
            continue;
          }
          break;
        }
      }
    }
    return "I'm sorry, the AI service is currently experiencing high demand. Please wait a moment and try again!";
  }

  // --- Wrapper Services for controllers ---

  static async getUserFinancialInsights(userId: string) {
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(100)
      .select('amount description date type merchantName');

    if (transactions.length === 0) {
      return { message: "Upload some statements first to get AI insights!" };
    }

    const serializedData = transactions.map(t => {
      const json = t.toJSON();
      return {
        ...json,
        description: decrypt(json.description) || '',
        merchantName: json.merchantName ? decrypt(json.merchantName) || null : null,
        amount: Number(json.amount) / 100
      };
    });

    return this.generateInsights(serializedData);
  }

  static async handleUserChat(userId: string, message: string, history: any[]) {
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(80)
      .populate('categoryId');

    const budgets = await Budget.find({ userId }).populate('categoryId');

    const decryptedTxs = transactions.map(t => {
      const json = t.toJSON();
      const catName = json.category ? json.category.name : 'Uncategorized';
      return {
        amount: Number(json.amount) / 100,
        description: decrypt(json.description) || '',
        merchantName: json.merchantName ? decrypt(json.merchantName) : null,
        type: json.type,
        date: new Date(json.date).toISOString().split('T')[0],
        category: catName
      };
    });

    const budgetsSummary = budgets.map(b => {
      const json = b.toJSON();
      const catName = json.category ? json.category.name : 'Uncategorized';
      return {
        category: catName,
        limit: Number(json.amount) / 100
      };
    });

    const financialContext = {
      budgets: budgetsSummary,
      recentTransactions: decryptedTxs
    };

    const reply = await this.chat(message, history || [], financialContext);
    
    const suggestedPrompts = [
      "Where did I overspend this month?",
      "How much can I save yearly?",
      "Which subscriptions should I cancel?",
      "Can I afford a ₹50,000 laptop?"
    ];

    return { reply, suggestedPrompts };
  }
}
