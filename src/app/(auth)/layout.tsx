import { PennywiseIcon } from "@/components/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
                <PennywiseIcon className="size-8" />
                Pennywise
            </div>
        </div>
        {children}
      </div>
    </main>
  );
}
