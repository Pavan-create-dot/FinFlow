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
