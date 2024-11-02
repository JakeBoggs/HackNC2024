'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { processChat } from '@/app/actions/chat';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatInterfaceProps {
  list: any;
  onUpdateList: (list: any) => void;
}

export default function ChatInterface({ list, onUpdateList }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(list.messages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMessages(list.messages || []);
  }, [list.id, list.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const result = await processChat(list.id, input, messages, list);
      
      if (result.list) {
        onUpdateList(result.list);
      }

      setMessages(prev => [
        ...prev,
        { role: 'user', content: input },
        { role: 'assistant', content: result.message },
      ]);
      
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-8'
                : 'bg-gray-100 mr-8'
            }`}
          >
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => (
                  <p className="mb-2" {...props} />
                ),
                h1: ({node, ...props}) => (
                  <h1 className="text-2xl font-bold mb-4" {...props} />
                ),
                h2: ({node, ...props}) => (
                  <h2 className="text-xl font-bold mb-3" {...props} />
                ),
                h3: ({node, ...props}) => (
                  <h3 className="text-lg font-bold mb-2" {...props} />
                ),
                ul: ({node, ...props}) => (
                  <ul className="list-disc list-inside mb-4" {...props} />
                ),
                ol: ({node, ...props}) => (
                  <ol className="list-decimal list-inside mb-4" {...props} />
                ),
                li: ({node, ...props}) => (
                  <li className="mb-1" {...props} />
                ),
                a: ({node, ...props}) => (
                  <a className="text-blue-600 hover:underline" {...props} />
                ),
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />
                ),
                code: ({node, inline, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="my-4">
                      <SyntaxHighlighter
                        language={match[1]}
                        style={oneDark}
                        PreTag="div"
                        className="rounded-md"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="bg-gray-200 rounded px-1 py-0.5" {...props}>
                      {children}
                    </code>
                  );
                },
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-gray-300" {...props} />
                  </div>
                ),
                th: ({node, ...props}) => (
                  <th className="px-3 py-2 bg-gray-50 text-left text-sm font-semibold text-gray-900" {...props} />
                ),
                td: ({node, ...props}) => (
                  <td className="px-3 py-2 text-sm text-gray-500" {...props} />
                ),
                hr: ({node, ...props}) => (
                  <hr className="my-4 border-t border-gray-300" {...props} />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}