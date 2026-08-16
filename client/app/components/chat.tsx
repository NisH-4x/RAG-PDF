'use client';

import * as React from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  LoaderCircle,
  Sparkles,
  FileText,
  ChevronDown,
  TriangleAlert,
  Lock,
} from 'lucide-react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: { pageNumber?: number };
    source?: string;
  };
}

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  documents?: Doc[];
  isError?: boolean;
}

const SUGGESTIONS = [
  'What is this document about?',
  'Summarise the key points',
  'What are the main requirements?',
];

/** `uploads\1786861610372-145432292-Handbook.pdf` -> `Handbook.pdf` */
function prettySource(source?: string) {
  if (!source) return 'Source';
  const base = source.split(/[\\/]/).pop() ?? source;
  return base.replace(/^\d+-\d+-/, '');
}

const markdownComponents: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 first:mt-0 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 first:mt-0 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mt-4 mb-2 text-base font-semibold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-4 mb-2 text-sm font-semibold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1.5 text-sm font-semibold first:mt-0">{children}</h3>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium underline underline-offset-2"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3" />,
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? '');
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="my-2">{children}</pre>,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border px-2 py-1 align-top">{children}</td>,
};

function Sources({ documents }: { documents: Doc[] }) {
  return (
    <details className="group mt-3 rounded-lg border bg-background/60">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
        <FileText className="size-3.5" />
        <span>
          {documents.length} source{documents.length === 1 ? '' : 's'}
        </span>
        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-2 border-t px-3 py-2.5">
        {documents.map((doc, index) => (
          <div key={index} className="text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
              <span className="font-medium text-foreground">
                {prettySource(doc.metadata?.source)}
              </span>
              {doc.metadata?.loc?.pageNumber !== undefined && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                  page {doc.metadata.loc.pageNumber}
                </span>
              )}
            </div>
            {doc.pageContent && (
              <p className="mt-1 line-clamp-3 text-muted-foreground">
                {doc.pageContent.replace(/\s+/g, ' ').trim()}
              </p>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}

const ChatComponent: React.FC = () => {
  const { isLoaded, isSignedIn } = useAuth();

  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Grow the composer with its content, up to a cap.
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [message]);

  const sendMessage = async (text: string) => {
    const query = text.trim();
    if (!query || isLoading || !isSignedIn) return;

    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch(
        `http://localhost:8000/chat?message=${encodeURIComponent(query)}`
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.message,
          documents: data?.docs,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err instanceof Error
              ? err.message
              : 'Something went wrong. Is the server running on port 8000?',
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Sparkles className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold tracking-tight">
                Ask about your PDF
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Upload a document on the left, then ask a question. Answers cite
                the pages they came from.
              </p>
              {isSignedIn && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      className="cursor-pointer rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((msg, index) =>
                msg.role === 'user' ? (
                  <div key={index} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={index} className="flex gap-3">
                    <div
                      className={cn(
                        'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg',
                        msg.isError
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {msg.isError ? (
                        <TriangleAlert className="size-3.5" />
                      ) : (
                        <Sparkles className="size-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          'text-sm leading-relaxed',
                          msg.isError && 'text-destructive'
                        )}
                      >
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {msg.content ?? ''}
                        </Markdown>
                      </div>
                      {msg.documents && msg.documents.length > 0 && (
                        <Sources documents={msg.documents} />
                      )}
                    </div>
                  </div>
                )
              )}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Sparkles className="size-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 pt-1.5">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          {!isLoaded ? (
            // Auth state is still resolving — render a neutral placeholder so
            // neither the composer nor the sign-in prompt flashes incorrectly.
            <div className="h-[46px] animate-pulse rounded-2xl border bg-muted/40" />
          ) : !isSignedIn ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-6 text-center">
              <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Lock className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Sign in to ask questions</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  You need an account to chat with your documents.
                </p>
              </div>
              <SignInButton>
                <Button size="lg">Sign in</Button>
              </SignInButton>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2 rounded-2xl border bg-background p-1.5 pl-3 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(message);
                    }
                  }}
                  placeholder="Ask a question about your PDF…"
                  className="max-h-40 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button
                  size="icon"
                  onClick={() => sendMessage(message)}
                  disabled={!message.trim() || isLoading}
                  aria-label="Send message"
                  className="rounded-xl"
                >
                  {isLoading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Send />
                  )}
                </Button>
              </div>
              <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                Enter to send · Shift + Enter for a new line
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
