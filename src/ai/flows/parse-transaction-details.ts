'use server';

/**
 * @fileOverview A transaction details parsing AI agent.
 *
 * - parseTransactionDetails - A function that handles the transaction details parsing process.
 * - ParseTransactionDetailsInput - The input type for the parseTransactionDetails function.
 * - ParseTransactionDetailsOutput - The return type for the parseTransactionDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseTransactionDetailsInputSchema = z.object({
  emailBody: z.string().describe('The body of the email containing transaction details.'),
});
export type ParseTransactionDetailsInput = z.infer<typeof ParseTransactionDetailsInputSchema>;

const ParseTransactionDetailsOutputSchema = z.object({
  transactionDetails: z.object({
    date: z.string().describe('The date of the transaction (ISO format).'),
    amount: z.number().describe('The amount of the transaction.'),
    description: z.string().describe('A description of the transaction.'),
    category: z.string().describe('The category of the transaction (e.g., food, shopping, etc.).'),
  }).describe('Extracted details of the transaction.'),
});
export type ParseTransactionDetailsOutput = z.infer<typeof ParseTransactionDetailsOutputSchema>;

export async function parseTransactionDetails(input: ParseTransactionDetailsInput): Promise<ParseTransactionDetailsOutput> {
  return parseTransactionDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseTransactionDetailsPrompt',
  input: {schema: ParseTransactionDetailsInputSchema},
  output: {schema: ParseTransactionDetailsOutputSchema},
  prompt: `You are an AI assistant that extracts transaction details from emails.

  Given the content of an email, extract the following information:
  - date: The date of the transaction (ISO format).
  - amount: The amount of the transaction.
  - description: A description of the transaction.
  - category: The category of the transaction (e.g., food, shopping, etc.).

  Email Body: {{{emailBody}}}

  Return the extracted transaction details in JSON format.
  `,
});

const parseTransactionDetailsFlow = ai.defineFlow(
  {
    name: 'parseTransactionDetailsFlow',
    inputSchema: ParseTransactionDetailsInputSchema,
    outputSchema: ParseTransactionDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
