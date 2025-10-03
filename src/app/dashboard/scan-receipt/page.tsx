'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Sparkles, Camera, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { AllCategories, Category, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { categorizeTransaction } from '@/ai/flows/categorize-transactions';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { parseReceipt } from '@/ai/flows/parse-receipt-flow';
import Image from 'next/image';

export default function ScanReceiptPage() {
    const [isCategorizing, setIsCategorizing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isParsed, setIsParsed] = useState(false);
  
    const { user } = useUser();
    const firestore = useFirestore();
  
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'income' | 'expense' | ''>('expense');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [category, setCategory] = useState<Category | ''>('');
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
  
    const fileInputRef = useRef<HTMLInputElement>(null);
  
    const { toast } = useToast();
  
    const handleAiCategorize = async () => {
      if (!description) {
          toast({
              title: "Description needed",
              description: "Please enter a description to categorize.",
              variant: "destructive"
          })
        return;
      }
      setIsCategorizing(true);
      try {
          const result = await categorizeTransaction({ transactionDetails: description });
          setCategory(result.category);
          toast({
              title: "Categorized!",
              description: `Transaction categorized as ${result.category} with ${Math.round(result.confidence * 100)}% confidence.`
          })
      } catch(e) {
          console.error(e);
          toast({
              title: "Uh oh! Something went wrong.",
              description: "There was a problem with the AI categorization.",
              variant: "destructive"
          })
      } finally {
          setIsCategorizing(false);
      }
    };
  
    const resetForm = () => {
      setDescription('');
      setAmount('');
      setType('expense');
      setDate(new Date());
      setCategory('');
      setReceiptImage(null);
      setIsParsed(false);
    }
  
    const handleSave = async () => {
      if (!user || !firestore) return;
      if (!description || !amount || !type || !date || !category) {
        toast({
          title: "Missing fields",
          description: "Please fill out all fields to add a transaction.",
          variant: "destructive"
        });
        return;
      }
  
      setIsSaving(true);
      try {
          const newTransaction: Omit<Transaction, 'id'> = {
              userId: user.uid,
              description,
              amount: parseFloat(amount),
              type,
              date: date.toISOString(),
              category,
              // TODO: Add receiptImageUri after implementing Firebase Storage
          };
  
          const transactionsCol = collection(firestore, 'users', user.uid, 'transactions');
          await addDocumentNonBlocking(transactionsCol, newTransaction);
          
          toast({
              title: "Transaction added",
              description: "Your new transaction has been saved.",
          });
  
          resetForm();
  
      } catch (error) {
          console.error("Error adding transaction:", error);
          toast({
              title: "Error",
              description: "Could not save transaction. Please try again.",
              variant: "destructive"
          });
      } finally {
          setIsSaving(false);
      }
    }
  
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUri = reader.result as string;
          setReceiptImage(dataUri);
          handleReceiptParse(dataUri);
        };
        reader.readAsDataURL(file);
      }
    };
  
    const handleReceiptParse = async (dataUri: string) => {
      setIsParsing(true);
      setIsParsed(false);
      try {
          const result = await parseReceipt({ receiptDataUri: dataUri });
          
          if (result.merchant) setDescription(result.merchant);
          if (result.total) setAmount(result.total.toString());
          if (result.date) {
              try {
                  const parsedDate = parseISO(result.date);
                  setDate(parsedDate);
              } catch (e) {
                  console.warn("Could not parse date from AI, using today.", e)
                  setDate(new Date());
              }
          }
          
          toast({
              title: "Receipt Scanned!",
              description: "We've pre-filled the form with the receipt details.",
          });
          
          setIsParsed(true);

          if (result.merchant) {
              handleAiCategorize();
          }
  
      } catch(e) {
          console.error("Error parsing receipt:", e);
          toast({
              title: "Parsing Error",
              description: "Could not automatically read the receipt.",
              variant: "destructive"
          })
      } finally {
          setIsParsing(false);
      }
    }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Scan Receipt</h1>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Upload Receipt</CardTitle>
                    <CardDescription>Upload an image or use your camera to scan a receipt.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center">
                    <div 
                        className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isParsing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="mt-2 text-sm text-muted-foreground">Scanning receipt...</p>
                            </div>
                        )}
                        {receiptImage ? (
                            <Image src={receiptImage} alt="Receipt preview" layout="fill" objectFit="contain" className="rounded-lg" />
                        ) : (
                            <div className="text-center">
                                <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-sm text-muted-foreground">Tap to scan a receipt</p>
                                <p className="text-xs text-muted-foreground">Use your camera or upload an image</p>
                            </div>
                        )}
                        <Input 
                            id="receipt-upload" 
                            type="file" 
                            accept="image/*"
                            capture="environment"
                            ref={fileInputRef} 
                            className="sr-only" 
                            onChange={handleFileChange}
                            disabled={isParsing}
                        />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Transaction Details</CardTitle>
                    <CardDescription>Review the extracted information and save the transaction.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!isParsed && !isParsing && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <p>Upload a receipt to get started.</p>
                        </div>
                    )}
                     {(isParsing || isParsed) && (
                        <>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Type</Label>
                                <Select value={type} onValueChange={(value) => setType(value as 'income' | 'expense' | '')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="expense">Expense</SelectItem>
                                    <SelectItem value="income">Income</SelectItem>
                                </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={'outline'}
                                className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <div className="flex gap-2">
                            <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
                                <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                {AllCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                    {cat}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleAiCategorize}
                                disabled={isCategorizing || !description}
                                aria-label="Categorize with AI"
                            >
                                {isCategorizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            </Button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={resetForm}>Clear</Button>
                            <Button onClick={handleSave} disabled={isSaving || isParsing}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Save Transaction
                            </Button>
                        </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
