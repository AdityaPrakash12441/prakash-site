'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export default function SignupPage() {
    const router = useRouter();
    const auth = useAuth();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
          router.push('/dashboard');
        }
      }, [user, router]);
  
    const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        if (firebaseUser) {
            await updateProfile(firebaseUser, {
                displayName: name,
            });

            // Create user document in Firestore
            const userRef = doc(firestore, 'users', firebaseUser.uid);
            await setDoc(userRef, {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: name,
            });
        }

        router.push('/dashboard');
      } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.message
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isUserLoading || user) {
        return (
          <div className="flex min-h-screen items-center justify-center">
            <p>Loading...</p>
          </div>
        );
      }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-headline">Create an account</CardTitle>
        <CardDescription>
          Enter your details below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" type="text" placeholder="Your Name" required disabled={isLoading} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)}/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)}/>
          </div>
          <Button className="w-full mt-2" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 text-sm">
        <div className="text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              Login
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
