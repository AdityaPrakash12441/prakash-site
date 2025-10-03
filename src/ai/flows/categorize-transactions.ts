'use server';

/**
 * @fileOverview Transaction categorization AI agent.
 *
 * - categorizeTransaction - A function that categorizes a transaction.
 * - CategorizeTransactionInput - The input type for the categorizeTransaction function.
 * - CategorizeTransactionOutput - The return type for the categorizeTransaction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeTransactionInputSchema = z.object({
  transactionDetails: z
    .string()
    .describe('The details of the transaction, including description, amount, and date.'),
});

export type CategorizeTransactionInput = z.infer<
  typeof CategorizeTransactionInputSchema
>;

const CategorySchema = z.enum([
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
  'Withdrawal',
]);

const CategorizeTransactionOutputSchema = z.object({
  category: CategorySchema.describe('The predicted category of the transaction.'),
  confidence: z
    .number()
    .describe('The confidence level of the categorization, from 0 to 1.'),
});

export type CategorizeTransactionOutput = z.infer<
  typeof CategorizeTransactionOutputSchema
>;

export async function categorizeTransaction(
  input: CategorizeTransactionInput
): Promise<CategorizeTransactionOutput> {
  return categorizeTransactionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeTransactionPrompt',
  input: {schema: CategorizeTransactionInputSchema},
  output: {schema: CategorizeTransactionOutputSchema},
  prompt: `You are a personal finance expert tasked with categorizing transactions.

  Based on the transaction details, determine the most appropriate category for the transaction. You MUST respond with a valid category from the CategorySchema and a confidence level between 0 and 1 (inclusive).

  Transaction Details: {{{transactionDetails}}}

  Here are the possible categories (only use these):
  - Groceries
  - Dining
  - Shopping
  - Entertainment
  - Utilities
  - Rent
  - Mortgage
  - Transportation
  - Healthcare
  - Travel
  - Other
  - Salary
  - Bonus
  - Investment
  - Withdrawal`,
});

const categorizeTransactionFlow = ai.defineFlow(
  {
    name: 'categorizeTransactionFlow',
    inputSchema: CategorizeTransactionInputSchema,
    outputSchema: CategorizeTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
