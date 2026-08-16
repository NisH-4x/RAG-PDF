import { SignIn } from '@clerk/nextjs';
import { FileText } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-4 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <FileText className="size-5" />
        </div>
        <h1 className="mt-3 text-lg font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to upload PDFs and ask questions about them.
        </p>
      </div>

      <SignIn />
    </div>
  );
}
