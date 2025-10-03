'use client';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import { DollarSign, CreditCard, Landmark, Target } from 'lucide-react';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { CategoryChart } from '@/components/dashboard/category-chart';
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import type { Transaction, UserProfile } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
      }, [user, firestore]);
    const { data: userProfile, isLoading: isLoadingUserProfile } = useDoc<UserProfile>(userDocRef);

    const transactionsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'transactions'));
    }, [user, firestore]);

    const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

    const { totalExpenses, remainingBudget } = useMemo(() => {
        if (!transactions || !userProfile) {
            return { totalExpenses: 0, remainingBudget: 0 };
        }
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const monthlyBudget = userProfile?.monthlyBudget || 0;
        const remainingBudget = monthlyBudget - totalExpenses;
        return { totalExpenses, remainingBudget };
    }, [transactions, userProfile]);

    const isLoading = isLoadingTransactions || isLoadingUserProfile;
    
  return (
    <div className="space-y-4">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Monthly Budget
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">₹{(userProfile?.monthlyBudget || 0).toFixed(2)}</div> }
                    <p className="text-xs text-muted-foreground">
                    This month's spending goal
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Total Expenses
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">₹{totalExpenses.toFixed(2)}</div> }
                    <p className="text-xs text-muted-foreground">
                    This month
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">₹{remainingBudget.toFixed(2)}</div> }
                    <p className="text-xs text-muted-foreground">
                    Left to spend this month
                    </p>
                </CardContent>
            </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
                <OverviewChart />
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 gap-4">
                <CategoryChart />
            </div>
        </div>
        <div className="grid gap-4">
            <RecentTransactions />
        </div>
    </div>
  );
}
