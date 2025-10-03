export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
};

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
  category: Category;
  amount: number;
};
