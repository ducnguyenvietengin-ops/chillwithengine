
import { CategoryType, BudgetCategory, Account } from './types';

export const INITIAL_CATEGORIES: BudgetCategory[] = [
  { id: '1', name: 'Tiết kiệm', percentage: 20, type: CategoryType.SAVINGS, color: '#3b82f6' },
  { id: '2', name: 'Từ thiện', percentage: 2.5, type: CategoryType.CHARITY, color: '#ec4899' },
  { id: '3', name: 'Đầu tư', percentage: 10, type: CategoryType.INVESTMENT, color: '#10b981' },
  { id: '4', name: 'Chi tiêu', percentage: 67.5, type: CategoryType.SPENDING, color: '#f59e0b' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc1', name: 'Tiền mặt', balance: 0, type: 'CASH' },
  { id: 'acc2', name: 'Ngân hàng VCB', balance: 0, type: 'BANK' },
];

export const CURRENCY_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});
