import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { transactions } from '@/lib/data';
import { cn } from '@/lib/utils';
import {
    ShoppingCart,
    Utensils,
    Ticket,
    Lightbulb,
    Home,
    Car,
    HeartPulse,
    Plane,
    Landmark,
    MoreHorizontal,
    ShoppingBag
  } from 'lucide-react';
import type { Category } from '@/lib/types';

const categoryIcons: Record<Category, React.ElementType> = {
    Groceries: ShoppingCart,
    Dining: Utensils,
    Shopping: ShoppingBag,
    Entertainment: Ticket,
    Utilities: Lightbulb,
    Rent: Home,
    Mortgage: Home,
    Transportation: Car,
    Healthcare: HeartPulse,
    Travel: Plane,
    Salary: Landmark,
    Bonus: Landmark,
    Investment: Landmark,
    Withdrawal: Landmark,
    Other: MoreHorizontal,
};

export function RecentTransactions() {
  const recentTransactions = transactions.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Recent Transactions</CardTitle>
        <CardDescription>Here are your 5 most recent transactions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentTransactions.map((transaction) => {
            const Icon = categoryIcons[transaction.category] || MoreHorizontal;
          return (
          <div key={transaction.id} className="flex items-center">
            <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <Icon className="h-4 w-4" />
                </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{transaction.description}</p>
              <p className="text-sm text-muted-foreground">{transaction.category}</p>
            </div>
            <div className={cn("ml-auto font-medium", transaction.type === 'income' ? 'text-green-600' : '')}>
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
            </div>
          </div>
        )})}
      </CardContent>
    </Card>
  );
}
