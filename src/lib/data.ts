import type { Transaction, Budget, Category } from './types';

export const transactions: Transaction[] = [
  { id: '1', date: new Date(new Date().setDate(1)).toISOString(), description: 'Monthly Salary', amount: 5000, type: 'income', category: 'Salary' },
  { id: '2', date: new Date(new Date().setDate(2)).toISOString(), description: 'Grocery Shopping at Whole Foods', amount: 150.75, type: 'expense', category: 'Groceries' },
  { id: '3', date: new Date(new Date().setDate(3)).toISOString(), description: 'Dinner with friends', amount: 85.50, type: 'expense', category: 'Dining' },
  { id: '4', date: new Date(new Date().setDate(5)).toISOString(), description: 'Netflix Subscription', amount: 15.99, type: 'expense', category: 'Entertainment' },
  { id: '5', date: new Date(new Date().setDate(5)).toISOString(), description: 'Electricity Bill', amount: 75.00, type: 'expense', category: 'Utilities' },
  { id: '6', date: new Date(new Date().setDate(7)).toISOString(), description: 'New pair of shoes', amount: 120.00, type: 'expense', category: 'Shopping' },
  { id: '7', date: new Date(new Date().setDate(10)).toISOString(), description: 'Gas for car', amount: 55.20, type: 'expense', category: 'Transportation' },
  { id: '8', date: new Date(new Date().setDate(12)).toISOString(), description: 'Movie tickets', amount: 30.00, type: 'expense', category: 'Entertainment' },
  { id: '9', date: new Date(new Date().setDate(15)).toISOString(), description: 'Rent Payment', amount: 1500.00, type: 'expense', category: 'Rent' },
  { id: '10', date: new Date(new Date().setDate(16)).toISOString(), description: 'Stock Investment', amount: 500.00, type: 'expense', category: 'Investment' },
  { id: '11', date: new Date(new Date().setDate(18)).toISOString(), description: 'Pharmacy', amount: 25.50, type: 'expense', category: 'Healthcare' },
  { id: '12', date: new Date(new Date().setDate(20)).toISOString(), description: 'Weekend trip fuel', amount: 60.00, type: 'expense', category: 'Travel' },
  { id: '13', date: new Date(new Date().setDate(22)).toISOString(), description: 'Weekly groceries', amount: 90.30, type: 'expense', category: 'Groceries' },
  { id: '14', date: new Date(new Date().setDate(25)).toISOString(), description: 'Lunch meeting', amount: 45.80, type: 'expense', category: 'Dining' },
  { id: '15', date: new Date(new Date().setDate(28)).toISOString(), description: 'Freelance Project Payment', amount: 750, type: 'income', category: 'Bonus' },
];

export const budgets: Budget[] = [
  { category: 'Groceries', amount: 400 },
  { category: 'Dining', amount: 250 },
  { category: 'Shopping', amount: 300 },
  { category: 'Entertainment', amount: 150 },
  { category: 'Utilities', amount: 200 },
  { category: 'Transportation', amount: 150 },
  { category: 'Healthcare', amount: 100 },
  { category: 'Travel', amount: 500 },
  { category: 'Other', amount: 100 },
  { category: 'Rent', amount: 1500 },
];
