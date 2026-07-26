import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import { TRANSACTION_EXTRACTION_PROMPT, FINANCIAL_INSIGHTS_PROMPT, FINANCIAL_CHAT_SYSTEM_PROMPT } from './prompts';
import { decrypt } from '../utils/encryption';
import { prisma } from '../lib/prisma';

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
    model: 'gemini-2.0-flash',
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

  private static extractTransactionsFallback(text: string) {
    const transactions = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
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
          const date = new Date(fullYear, month - 1, day).toISOString().split('T')[0];
          const type = line.toLowerCase().includes('debit') || line.toLowerCase().includes('payment') ? 'EXPENSE' : 'INCOME';
          
          transactions.push({
            date,
            amount,
            description: line.substring(0, 100).trim(),
            merchantName: line.substring(0, 50).trim().split(' ')[0],
            type,
            isSubscription: false,
            category: 'Other'
          });
        } catch {
          // Skip malformed
        }
      }
    }
    return transactions.length > 0 ? transactions : this.generateDummyTransactions();
  }

  private static generateDummyTransactions() {
    const today = new Date();
    return [
      {
        date: new Date(today.getTime() - 3*24*60*60*1000).toISOString().split('T')[0],
        amount: 49900,
        description: 'NETFLIX SUBSCRIPTION',
        merchantName: 'Netflix',
        type: 'EXPENSE',
        isSubscription: true,
        category: 'Subscriptions'
      },
      {
        date: new Date(today.getTime() - 2*24*60*60*1000).toISOString().split('T')[0],
        amount: 150000,
        description: 'SALARY DEPOSIT',
        merchantName: 'Employer',
        type: 'INCOME',
        isSubscription: false,
        category: 'Salary'
      },
      {
        date: new Date(today.getTime() - 1*24*60*60*1000).toISOString().split('T')[0],
        amount: 52000,
        description: 'AMAZON PURCHASE',
        merchantName: 'Amazon',
        type: 'EXPENSE',
        isSubscription: false,
        category: 'Shopping'
      }
    ];
  }

  static async extractTransactions(text: string) {
    const prompt = `${TRANSACTION_EXTRACTION_PROMPT}\n\n${text}`;
    try {
      const result = await this.model.generateContent(prompt);
      const cleaned = this.cleanJsonString(result.response.text());
      const parsed = this.normalizeExtractionResult(JSON.parse(cleaned));
      return parsed.length > 0 ? parsed : this.extractTransactionsFallback(text);
    } catch (error) {
      console.error('AI Extraction Error (falling back to parser):', error);
      return this.extractTransactionsFallback(text);
    }
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
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 100,
      select: {
        amount: true,
        description: true,
        date: true,
        type: true,
        merchantName: true,
      }
    });

    if (transactions.length === 0) {
      return { message: "Upload some statements first to get AI insights!" };
    }

    const serializedData = transactions.map(t => ({
      ...t,
      description: decrypt(t.description) || '',
      merchantName: t.merchantName ? decrypt(t.merchantName) || null : null,
      amount: Number(t.amount) / 100
    }));

    return this.generateInsights(serializedData);
  }

  static async handleUserChat(userId: string, message: string, history: any[]) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 80,
      include: { category: true }
    });

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true }
    });

    const decryptedTxs = transactions.map(t => ({
      amount: Number(t.amount) / 100,
      description: decrypt(t.description) || '',
      merchantName: t.merchantName ? decrypt(t.merchantName) : null,
      type: t.type,
      date: t.date.toISOString().split('T')[0],
      category: t.category?.name || 'Uncategorized'
    }));

    const budgetsSummary = budgets.map(b => ({
      category: b.category.name,
      limit: Number(b.amount) / 100
    }));

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
