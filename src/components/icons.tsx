import { cn } from "@/lib/utils";

export function PennywiseIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-6", className)}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M12 16h-4a4 4 0 0 0 0-8h4" />
    </svg>
  );
}
