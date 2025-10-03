'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { budgets as initialBudgets, transactions } from '@/lib/data';
import type { Budget, Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [editingBudgets, setEditingBudgets] = useState<Partial<Record<Category, number | string>>>(
    initialBudgets.reduce((acc, b) => ({ ...acc, [b.category]: b.amount }), {})
  );

  const handleBudgetChange = (category: Category, value: string) => {
    setEditingBudgets(prev => ({ ...prev, [category]: value }));
  };

  const handleSaveBudgets = () => {
    const newBudgets = budgets.map(b => {
      const newAmount = Number(editingBudgets[b.category]);
      return { ...b, amount: isNaN(newAmount) ? b.amount : newAmount };
    });
    setBudgets(newBudgets);
    // Here you would typically save to a database
  };

  const spendingByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<Category, number>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Budgets</h1>
        <Button onClick={handleSaveBudgets}>Save Changes</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Budgets</CardTitle>
          <CardDescription>Set and track your spending for each category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {budgets.map((budget) => {
            const spent = spendingByCategory[budget.category] || 0;
            const progress = (spent / budget.amount) * 100;
            const remaining = budget.amount - spent;

            return (
              <div key={budget.category} className="space-y-2">
                <div className="flex justify-between items-center gap-4">
                    <Label htmlFor={`budget-${budget.category}`} className="font-medium whitespace-nowrap">{budget.category}</Label>
                    <div className="flex items-center gap-2 w-full max-w-xs">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                            id={`budget-${budget.category}`}
                            type="number"
                            value={editingBudgets[budget.category]}
                            onChange={(e) => handleBudgetChange(budget.category, e.target.value)}
                            className="w-full h-8"
                        />
                    </div>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Spent: ${spent.toFixed(2)}</span>
                  <span className={cn(remaining < 0 ? 'text-red-500' : '')}>
                    {remaining >= 0 ? `$${remaining.toFixed(2)} remaining` : `$${Math.abs(remaining).toFixed(2)} over`}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
