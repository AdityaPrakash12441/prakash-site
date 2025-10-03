'use client';

import * as React from 'react';
import { Pie, PieChart, Sector, ResponsiveContainer } from 'recharts';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from '@/components/ui/card';
  import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
  } from '@/components/ui/chart';
import { AllCategories, type Transaction, type Category } from '@/lib/types';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

const chartConfig = AllCategories.reduce((acc, category, index) => {
    acc[category] = {
      label: category,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
    return acc;
  }, {} as ChartConfig);
  

export function CategoryChart() {
    const { user } = useUser();
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'users', user.uid, 'transactions'), where('type', '==', 'expense'));
    }, [user, firestore]);

    const { data: expenses, isLoading } = useCollection<Transaction>(transactionsQuery);

    const [activeCategory, setActiveCategory] = React.useState<Category | null>(null);

    const categoryTotals = React.useMemo(() => {
        if (!expenses) return {};
        return expenses.reduce((acc, transaction) => {
            if (!acc[transaction.category]) {
                acc[transaction.category] = 0;
            }
            acc[transaction.category] += transaction.amount;
            return acc;
        }, {} as Record<Category, number>);
    }, [expenses]);
    

    const chartData = React.useMemo(() => {
        return Object.entries(categoryTotals).map(([category, total]) => ({
            category: category as Category,
            total,
            fill: `var(--color-${category})`,
        })).sort((a, b) => b.total - a.total);
    }, [categoryTotals]);


  const activeIndex = React.useMemo(
    () => chartData.findIndex((item) => item.category === activeCategory),
    [activeCategory, chartData]
  );
  const allTotal = React.useMemo(() => chartData.reduce((acc, curr) => acc + curr.total, 0), [chartData]);

  if (isLoading) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="flex-1 pb-0 flex items-center justify-center">
                <Skeleton className="h-[250px] w-[250px] rounded-full" />
            </CardContent>
            <CardContent className="flex-1 flex flex-col justify-center items-center text-sm p-4">
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Spending by Category</CardTitle>
        <CardDescription>
            Showing total spending for the current month.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
      <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={60}
                  strokeWidth={5}
                  activeIndex={activeIndex}
                  activeShape={({
                    outerRadius = 0,
                    ...props
                  }) => (
                    <g>
                      <Sector {...props} outerRadius={outerRadius + 10} />
                      <Sector
                        {...props}
                        outerRadius={outerRadius}
                        innerRadius={outerRadius/1.2}
                      />
                    </g>
                  )}
                  onMouseOver={(_, index) => {
                      setActiveCategory(chartData[index].category)
                  }}
                  onMouseLeave={() => setActiveCategory(null)}
                />
              </PieChart>
              </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                No expense data for this month.
            </div>
          )}
        </ChartContainer>
      </CardContent>
      <CardContent className="flex-1 flex flex-col justify-center items-center text-sm p-4">
        {activeCategory ? (
            <>
            <div className="font-medium">
                {activeCategory}
            </div>
            <div className="text-muted-foreground">
                ${chartData.find(d => d.category === activeCategory)?.total.toFixed(2)}
                {' / '}
                {allTotal > 0 ? (((chartData.find(d => d.category === activeCategory)?.total || 0) / allTotal) * 100).toFixed(1) : 0}%
            </div>
            </>
        ) : (
            <>
            <div className="font-medium">Total Expenses</div>
            <div className="text-muted-foreground">${allTotal.toFixed(2)}</div>
            </>
        )}
      </CardContent>
    </Card>
  );
}
