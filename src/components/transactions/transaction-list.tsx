'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Category, Transaction } from '@/lib/types';
import { Button } from '../ui/button';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ShoppingCart,
  Utensils,
  Ticket,
  Lightbulb,
  Home,
  Car,
  HeartPulse,
  Plane,
  Landmark,
  ShoppingBag
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

const categoryDetails: Record<
  Category,
  { icon: React.ElementType; color: string }
> = {
  Groceries: { icon: ShoppingCart, color: 'bg-blue-100 text-blue-800' },
  Dining: { icon: Utensils, color: 'bg-orange-100 text-orange-800' },
  Shopping: { icon: ShoppingBag, color: 'bg-purple-100 text-purple-800' },
  Entertainment: { icon: Ticket, color: 'bg-pink-100 text-pink-800' },
  Utilities: { icon: Lightbulb, color: 'bg-yellow-100 text-yellow-800' },
  Rent: { icon: Home, color: 'bg-red-100 text-red-800' },
  Mortgage: { icon: Home, color: 'bg-red-100 text-red-800' },
  Transportation: { icon: Car, color: 'bg-indigo-100 text-indigo-800' },
  Healthcare: { icon: HeartPulse, color: 'bg-rose-100 text-rose-800' },
  Travel: { icon: Plane, color: 'bg-cyan-100 text-cyan-800' },
  Salary: { icon: Landmark, color: 'bg-green-100 text-green-800' },
  Bonus: { icon: Landmark, color: 'bg-green-100 text-green-800' },
  Investment: { icon: Landmark, color: 'bg-emerald-100 text-emerald-800' },
  Withdrawal: { icon: Landmark, color: 'bg-gray-100 text-gray-800' },
  Other: { icon: MoreHorizontal, color: 'bg-gray-100 text-gray-800' },
};

export function TransactionList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
  }, [user, firestore]);

  const { data: transactions, isLoading, error } = useCollection<Transaction>(transactionsQuery);

  const handleDelete = (transactionId: string) => {
    if (!user || !firestore) return;

    const docRef = doc(firestore, 'users', user.uid, 'transactions', transactionId);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Transaction Deleted",
      description: "The transaction has been successfully deleted.",
    })
  }

  if (isLoading) {
    return (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/4" />
                </div>
            ))}
        </div>
    )
  }

  if (error) {
    return <p className="text-red-500">Error loading transactions: {error.message}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions && transactions.map((transaction) => {
          const { icon: Icon, color } = categoryDetails[transaction.category];
          return (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">{transaction.description}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("border-0", color)}>
                  <Icon className="mr-1 h-3 w-3" />
                  {transaction.category}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(transaction.date), 'MMM d, yyyy')}</TableCell>
              <TableCell className={cn("text-right", transaction.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem disabled>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(transaction.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
        {transactions?.length === 0 && (
            <TableRow>
                <TableCell colSpan={5} className="text-center h-24">No transactions yet.</TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
