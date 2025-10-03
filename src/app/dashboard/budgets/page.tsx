'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import type { Budget, Category, Transaction, UserProfile } from '@/lib/types';
import { AllCategories } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, writeBatch, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function BudgetsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile, isLoading: isLoadingUserProfile } = useDoc<UserProfile>(userDocRef);

  const budgetsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'categories'));
  }, [user, firestore]);

  const { data: budgets, isLoading: isLoadingBudgets } = useCollection<Budget>(budgetsQuery);

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), where('type', '==', 'expense'));
  }, [user, firestore]);

  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const [editingBudgets, setEditingBudgets] = useState<Record<string, string>>({});
  const [totalBudget, setTotalBudget] = useState('');

  useEffect(() => {
    if (budgets) {
      const budgetMap = budgets.reduce((acc, b) => {
        if (b.category && b.amount) {
            acc[b.category] = b.amount.toString();
        }
        return acc;
      }, {} as Record<string, string>);
      setEditingBudgets(budgetMap);
    }
  }, [budgets]);

  useEffect(() => {
    if (userProfile?.monthlyBudget) {
      setTotalBudget(userProfile.monthlyBudget.toString());
    }
  }, [userProfile]);

  const handleBudgetChange = (category: Category, value: string) => {
    setEditingBudgets(prev => ({ ...prev, [category]: value }));
  };

  const handleSaveBudgets = async () => {
    if (!user || !firestore) return;
    setIsSaving(true);
    
    const batch = writeBatch(firestore);

    // Save category budgets
    for (const category of AllCategories) {
        const existingBudget = budgets?.find(b => b.category === category);
        const newAmountStr = editingBudgets[category];
        const newAmount = newAmountStr !== undefined && newAmountStr !== '' ? parseFloat(newAmountStr) : null;

        if (newAmount !== null && !isNaN(newAmount)) {
            if (existingBudget) {
                if (existingBudget.amount !== newAmount) {
                    const budgetRef = doc(firestore, 'users', user.uid, 'categories', existingBudget.id);
                    batch.update(budgetRef, { amount: newAmount });
                }
            } else {
                const newBudgetRef = doc(collection(firestore, 'users', user.uid, 'categories'));
                batch.set(newBudgetRef, {
                    userId: user.uid,
                    category: category,
                    amount: newAmount,
                });
            }
        }
    }

    try {
        await batch.commit();

        // Save total budget
        const newTotalBudget = parseFloat(totalBudget);
        if (!isNaN(newTotalBudget) && userDocRef) {
          await updateDoc(userDocRef, { monthlyBudget: newTotalBudget });
        } else if (totalBudget === '' && userDocRef) {
          await updateDoc(userDocRef, { monthlyBudget: null });
        }
        
        toast({
            title: "Budgets Saved",
            description: "Your budget changes have been saved successfully.",
        });
    } catch (error) {
        console.error("Error saving budgets: ", error);
        toast({
            title: "Error",
            description: "There was a problem saving your budgets.",
            variant: "destructive"
        })
    } finally {
        setIsSaving(false);
    }
};

  const spendingByCategory = useMemo(() => {
    if (!transactions) return {};
    return transactions.reduce((acc, t) => {
      if (t.category) {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<Category, number>);
  }, [transactions]);

  const totalSpent = useMemo(() => {
    return Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0);
  }, [spendingByCategory]);

  const totalBudgetAmount = parseFloat(totalBudget) || 0;
  const totalRemaining = totalBudgetAmount - totalSpent;
  const totalProgress = totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0;

  const isLoading = isLoadingBudgets || isLoadingTransactions || isLoadingUserProfile;

  const displayCategories = AllCategories.filter(c => !['Salary', 'Bonus', 'Investment', 'Withdrawal'].includes(c));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Budgets</h1>
        <Button onClick={handleSaveBudgets} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Monthly Budget</CardTitle>
          <CardDescription>Set a total budget for all your spending this month.</CardDescription>
        </CardHeader>
        <CardContent>
        {isLoading ? (
            <div className="space-y-2">
                <div className="flex justify-between items-center gap-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-40" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-36" />
                </div>
            </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-4">
                <Label htmlFor="total-budget" className="font-medium whitespace-nowrap text-lg">Your Goal</Label>
                <div className="flex items-center gap-2 w-full max-w-xs">
                    <span className="text-muted-foreground">₹</span>
                    <Input
                        id="total-budget"
                        type="number"
                        placeholder="e.g., 30000"
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(e.target.value)}
                        className="h-9 text-lg font-semibold"
                    />
                </div>
            </div>
            {totalBudgetAmount > 0 && (
              <>
                <Progress value={totalProgress} className="h-4" />
                <div className="flex justify-between font-medium">
                  <span>Spent: ₹{totalSpent.toFixed(2)}</span>
                  <span className={cn(totalRemaining < 0 ? 'text-red-500' : '')}>
                    {totalRemaining >= 0 ? `₹${totalRemaining.toFixed(2)} remaining` : `₹${Math.abs(totalRemaining).toFixed(2)} over`}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Category Budgets</CardTitle>
          <CardDescription>Set and track your spending for each category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center gap-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))
          ) : (
            displayCategories.map((category) => {
              const budgetAmount = parseFloat(editingBudgets[category] || '0') || 0;
              const spent = spendingByCategory[category] || 0;
              const progress = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
              const remaining = budgetAmount - spent;
              const hasBudget = budgetAmount > 0;

              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center gap-4">
                      <Label htmlFor={`budget-${category}`} className="font-medium whitespace-nowrap">{category}</Label>
                      <div className="flex items-center gap-2 w-full max-w-xs">
                          <span className="text-sm text-muted-foreground">₹</span>
                          <Input
                              id={`budget-${category}`}
                              type="number"
                              placeholder="Not set"
                              value={editingBudgets[category] || ''}
                              onChange={(e) => handleBudgetChange(category, e.target.value)}
                              className="w-full h-8"
                          />
                      </div>
                  </div>
                  {hasBudget && (
                    <>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Spent: ₹{spent.toFixed(2)}</span>
                        <span className={cn(remaining < 0 ? 'text-red-500' : '')}>
                          {remaining >= 0 ? `₹${remaining.toFixed(2)} remaining` : `₹${Math.abs(remaining).toFixed(2)} over`}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
