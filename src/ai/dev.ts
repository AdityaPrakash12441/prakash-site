import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-transactions.ts';
import '@/ai/flows/parse-transaction-details.ts';