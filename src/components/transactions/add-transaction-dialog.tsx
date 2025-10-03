'use client';

import { useState } from 'react';
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
import { CalendarIcon, Loader2, Sparkles, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AllCategories, Category, Transaction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { categorizeTransaction } from '@/ai/flows/categorize-transactions';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense' | ''>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [category, setCategory] = useState<Category | ''>('');

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
    setType('');
    setDate(new Date());
    setCategory('');
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Add Transaction</DialogTitle>
          <DialogDescription>
            Add a new transaction to your account. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="receipt" className="text-right">
              Receipt
            </Label>
            <div className="col-span-3">
              <Button asChild variant="outline" className="w-full">
                <Label htmlFor="receipt-upload" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Label>
              </Button>
              <Input id="receipt-upload" type="file" className="sr-only" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
