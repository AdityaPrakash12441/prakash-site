'use server';
/**
 * @fileOverview A receipt parsing AI agent.
 *
 * - parseReceipt - A function that handles the receipt parsing process.
 * - ParseReceiptInput - The input type for the parseReceipt function.
 * - ParseReceiptOutput - The return type for the parseReceipt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseReceiptInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ParseReceiptInput = z.infer<typeof ParseReceiptInputSchema>;

const ParseReceiptOutputSchema = z.object({
    merchant: z.string().optional().describe("The name of the merchant or store."),
    date: z.string().optional().describe("The date of the transaction in YYYY-MM-DD format."),
    total: z.number().optional().describe("The final total amount of the transaction."),
});
export type ParseReceiptOutput = z.infer<typeof ParseReceiptOutputSchema>;

export async function parseReceipt(input: ParseReceiptInput): Promise<ParseReceiptOutput> {
  return parseReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseReceiptPrompt',
  input: {schema: ParseReceiptInputSchema},
  output: {schema: ParseReceiptOutputSchema},
  prompt: `You are an expert receipt scanning AI. Your task is to extract the merchant name, the transaction date, and the final total amount from the provided receipt image.

  - The date should be in YYYY-MM-DD format.
  - The total should be a number, representing the final amount paid.
  - The merchant should be the name of the store.

  Analyze the following receipt:
  {{media url=receiptDataUri}}`,
});

const parseReceiptFlow = ai.defineFlow(
  {
    name: 'parseReceiptFlow',
    inputSchema: ParseReceiptInputSchema,
    outputSchema: ParseReceiptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
