export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  categoryId?: string | null;
  category?: {
    id?: string;
    name: string;
    color: string;
  } | null;
  merchantName?: string;
  isSubscription?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Statement {
  id: string;
  fileName: string;
  bankName: string;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  category: Category;
  amount: number;
  spent: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  createdAt?: string;
}

export interface CategorySummary {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  amount: number;
}

export interface FinanceSummary {
  totalSpend: number;
  totalIncome: number;
  savings: number;
  budgetStatus: string;
  categories: CategorySummary[];
  finScore: number;
  anomalies: string[];
  monthlyTrend: MonthlyTrend[];
}

