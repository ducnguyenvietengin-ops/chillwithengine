
export enum CategoryType {
  SAVINGS = 'SAVINGS',
  CHARITY = 'CHARITY',
  INVESTMENT = 'INVESTMENT',
  SPENDING = 'SPENDING',
  CUSTOM = 'CUSTOM'
}

export enum IncomeType {
  EMPLOYEE = 'E', // Làm thuê
  SELF_EMPLOYED = 'S', // Tự doanh
  BUSINESS_OWNER = 'B', // Làm chủ
  INVESTOR = 'I', // Đầu tư
  PASSIVE = 'P' // Thụ động
}

export interface BudgetCategory {
  id: string;
  name: string;
  percentage: number;
  type: CategoryType;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'CASH' | 'BANK' | 'CREDIT' | 'E-WALLET';
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string; // Used for expenses to map to budget funds
  accountId: string;
  type: TransactionType;
  incomeType?: IncomeType; // Classification for income
}

export interface AppState {
  income: number;
  categories: BudgetCategory[];
  accounts: Account[];
  transactions: Transaction[];
}
