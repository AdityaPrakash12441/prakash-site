'use client';

export type Transaction = {
  id: string;
  userId: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  receiptImageUri?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  monthlyBudget?: number;
}

export type Category = 
  | 'Groceries'
  | 'Dining'
  | 'Shopping'
  | 'Entertainment'
  | 'Utilities'
  | 'Rent'
  | 'Mortgage'
  | 'Transportation'
  | 'Healthcare'
  | 'Travel'
  | 'Other'
  | 'Salary'
  | 'Bonus'
  | 'Investment'
  | 'Withdrawal';

export const AllCategories: Category[] = [
  'Groceries',
  'Dining',
  'Shopping',
  'Entertainment',
  'Utilities',
  'Rent',
  'Mortgage',
  'Transportation',
  'Healthcare',
  'Travel',
  'Other',
  'Salary',
  'Bonus',
  'Investment',
  'Withdrawal'
];

export type Budget = {
  id?: string;
  userId: string;
  category: Category;
  amount: number;
};
