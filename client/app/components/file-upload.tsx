'use client';

import * as React from 'react';
import {
  Upload,
  FileText,
  LoaderCircle,
  CircleCheck,
  TriangleAlert,
  Lock,
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'uploading' | 'success' | 'error';

interface UploadedFile {
  name: string;
  size: number;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FileUploadComponent: React.FC = () => {
  const { isLoaded, isSignedIn } = useAuth();

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [status, setStatus] = React.useState<Status>('idle');
  const [error, setError] = React.useState<string>('');
  const [isDragging, setIsDragging] = React.useState(false);
  const [files, setFiles] = React.useState<UploadedFile[]>([]);

  const uploadFile = async (file: File) => {
    if (!isSignedIn) return;

    if (file.type !== 'application/pdf') {
      setStatus('error');
      setError('Only PDF files are supported.');
      return;
    }

    setStatus('uploading');
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const res = await fetch('http://localhost:8000/upload/pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed (${res.status})`);

      setFiles((prev) => [{ name: file.name, size: file.size }, ...prev]);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Upload failed.');
    }
  };

  const handleDrop = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    setIsDragging(false);
    const file = ev.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const isUploading = status === 'uploading';
  const isLocked = isLoaded && !isSignedIn;
  // Stay disabled while auth resolves so the zone is never briefly clickable
  // for a signed-out visitor.
  const isDisabled = isUploading || !isLoaded || isLocked;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Documents</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Upload a PDF to add it to the knowledge base.
        </p>
      </div>

      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        onClick={() => !isDisabled && inputRef.current?.click()}
        onKeyDown={(ev) => {
          if ((ev.key === 'Enter' || ev.key === ' ') && !isDisabled) {
            ev.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(ev) => {
          ev.preventDefault();
          if (!isDisabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background px-4 py-8 text-center transition-colors',
          isDisabled
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:border-ring/60 hover:bg-muted/50',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
          isDragging && !isDisabled && 'border-ring bg-muted',
          isUploading && 'pointer-events-none'
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {isUploading ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : isLocked ? (
            <Lock className="size-5" />
          ) : (
            <Upload className="size-5" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {isUploading
              ? 'Uploading…'
              : isLocked
                ? 'Sign in to upload'
                : 'Upload PDF file'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isLocked
              ? 'You need an account to add documents'
              : 'Drag and drop, or click to browse'}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(ev) => {
          const file = ev.target.files?.[0];
          if (file) uploadFile(file);
          ev.target.value = '';
        }}
      />

      {status === 'success' && (
        <div className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
          <CircleCheck className="mt-px size-3.5 shrink-0 text-foreground" />
          <span className="text-muted-foreground">
            Uploaded. Indexing runs in the background — give it a moment before
            asking about it.
          </span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            This session
          </p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2.5 rounded-lg border bg-background px-2.5 py-2"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatSize(file.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;
