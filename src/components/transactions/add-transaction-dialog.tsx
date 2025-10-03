'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { CalendarIcon, Loader2, Sparkles, Upload, Camera } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { AllCategories, Category, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { categorizeTransaction } from '@/ai/flows/categorize-transactions';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { parseReceipt } from '@/ai/flows/parse-receipt-flow';
import Image from 'next/image';

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

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
        };

        const transactionsCol = collection(firestore, 'users', user.uid, 'transactions');
        await addDocumentNonBlocking(transactionsCol, newTransaction);
        
        toast({
            title: "Transaction added",
            description: "Your new transaction has been saved.",
        });

        resetForm();
        setOpen(false);

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
    try {
        const result = await parseReceipt({ receiptDataUri: dataUri });
        
        if (result.merchant) setDescription(result.merchant);
        if (result.total) setAmount(result.total.toString());
        if (result.date) {
            try {
                // The date might not have a timezone, so parseISO handles it gracefully
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

        // Now, try to categorize it.
        if (result.merchant) {
            const categoryResult = await categorizeTransaction({ transactionDetails: result.merchant });
            setCategory(categoryResult.category);
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
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            resetForm();
        }
        setOpen(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Add Transaction</DialogTitle>
          <DialogDescription>
            Add a new transaction or scan a receipt to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div 
                className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70"
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
                        <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Tap to scan a receipt</p>
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
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or enter manually
                    </span>
                </div>
            </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select value={type} onValueChange={(value) => setType(value as 'income' | 'expense' | '')}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'col-span-3 justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <div className="col-span-3 flex gap-2">
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
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={isSaving || isParsing}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
