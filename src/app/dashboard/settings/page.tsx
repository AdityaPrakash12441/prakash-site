'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { transactions } from '@/lib/data';
import { parseTransactionDetails } from '@/ai/flows/parse-transaction-details';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.86 2.27-4.68 2.27-3.66 0-6.6-3-6.6-6.6s2.94-6.6 6.6-6.6c2.08 0 3.47.8 4.3 1.6l2.58-2.58C18.49.53 15.82 0 12.48 0 5.88 0 .48 5.4 .48 12s5.4 12 12 12c6.96 0 11.52-4.8 11.52-11.76 0-.79-.07-1.53-.2-2.32h-11.2z"
      />
    </svg>
  );

export default function SettingsPage() {
    const { toast } = useToast();
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const [name, setName] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [emailBody, setEmailBody] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    useEffect(() => {
        if (user?.displayName) {
            setName(user.displayName);
        }
    }, [user]);


    const handleProfileSave = async () => {
        if (!auth.currentUser) return;
        setIsSavingProfile(true);
        try {
            await updateProfile(auth.currentUser, { displayName: name });
            const userRef = doc(firestore, 'users', auth.currentUser.uid);
            await updateDoc(userRef, { name });
            toast({
                title: 'Profile Updated',
                description: 'Your name has been updated successfully.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update profile.',
            });
        } finally {
            setIsSavingProfile(false);
        }
    }

    const handleDataExport = (format: 'json' | 'csv') => {
        let dataStr: string;
        let fileName: string;

        if (format === 'json') {
            dataStr = JSON.stringify(transactions, null, 2);
            fileName = 'transactions.json';
        } else {
            const headers = Object.keys(transactions[0]);
            const csvRows = [
                headers.join(','),
                ...transactions.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','))
            ];
            dataStr = csvRows.join('\n');
            fileName = 'transactions.csv';
        }

        const blob = new Blob([dataStr], { type: `text/${format};charset=utf-8;` });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        toast({
            title: "Export complete!",
            description: `Your data has been exported as ${fileName}.`
        })
    };

    const handleParseEmail = async () => {
        if (!emailBody) {
            toast({
                title: "Email content needed",
                description: "Please paste the body of a transaction email.",
                variant: "destructive"
            });
            return;
        }
        setIsParsing(true);
        try {
            const result = await parseTransactionDetails({ emailBody });
            toast({
                title: "Email Parsed Successfully!",
                description: (
                    <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                        <code className="text-white">{JSON.stringify(result.transactionDetails, null, 2)}</code>
                    </pre>
                ),
            });
        } catch (e) {
            console.error(e);
            toast({
                title: "Uh oh! Something went wrong.",
                description: "There was a problem parsing the email.",
                variant: "destructive"
            });
        } finally {
            setIsParsing(false);
        }
    };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and app settings.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is how others will see you on the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSavingProfile}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email || ''} disabled />
          </div>
          <Button onClick={handleProfileSave} disabled={isSavingProfile}>
            {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Connect your email to automatically scan for transactions.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="outline">
                <GoogleIcon className="mr-2 h-4 w-4" />
                Connect Gmail Account
            </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>AI Tools</CardTitle>
            <CardDescription>Test the AI-powered transaction parser by pasting an email body below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Textarea 
                placeholder="Paste your transaction email content here..." 
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={6}
            />
            <Button onClick={handleParseEmail} disabled={isParsing}>
                {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Parse Transaction
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Export your transaction data for backup or use in other applications.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="secondary" onClick={() => handleDataExport('json')}>Export as JSON</Button>
          <Button variant="secondary" onClick={() => handleDataExport('csv')}>Export as CSV</Button>
        </CardContent>
      </Card>
    </div>
  );
}
