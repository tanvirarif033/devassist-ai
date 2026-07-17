import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatApi } from '../api/chat.api';
import type { Chat, Message } from '../types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../api/client';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');`;

const ACCENT_BY_AGENT: Record<string, string> = {
  code_review: '#35D0B8',
  bug_fix: '#F5A623',
  sql_generator: '#5B9DF9',
};

const accentFor = (agentType?: string) => (agentType && ACCENT_BY_AGENT[agentType]) || '#35D0B8';

const SendIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadChat(id);
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChat = async (chatId: string) => {
    try {
      const chatData = await chatApi.getChat(chatId);
      setChat(chatData);
      setMessages(chatData.messages || []);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      toast.error(message);
      navigate('/dashboard');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !id || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const toastId = toast.loading('Thinking — this can take up to 30 seconds.');

    try {
      const response = await chatApi.sendMessage(id, { message: input });

      toast.dismiss(toastId);
      toast.success('Response received.');

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response || 'No response received',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      toast.dismiss(toastId);
      const message = getErrorMessage(error);

      if (message.includes('timeout')) {
        toast.error('The agent is taking too long. Please try again.');
      } else if (message.includes('AI service')) {
        toast.error('The AI service is having an issue. Try again shortly.');
      } else {
        toast.error(message);
      }

      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async () => {
    if (!id) return;
    if (window.confirm('Delete this chat? This can\'t be undone.')) {
      try {
        await chatApi.deleteChat(id);
        toast.success('Chat deleted.');
        navigate('/dashboard');
      } catch (error: unknown) {
        const message = getErrorMessage(error);
        toast.error(message);
      }
    }
  };

  const accent = accentFor(chat?.agentType);

  return (
    <div className="h-screen bg-[#0B0E14] flex flex-col">
      <style>{FONT_IMPORT}</style>

      {/* Header */}
      <div className="bg-[#12161F] border-b border-[#262C38] px-4 sm:px-6 py-3 flex justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="font-['JetBrains_Mono'] text-sm text-[#9AA3B2] hover:text-[#E7E9EE] transition-colors shrink-0"
          >
            ← back
          </button>
          <div className="w-px h-5 bg-[#262C38] hidden sm:block" />
          <h1 className="font-['Inter'] font-semibold text-[#E7E9EE] truncate hidden sm:block">
            {chat?.title || 'Chat'}
          </h1>
          {chat?.agentType && (
            <span
              className="font-['JetBrains_Mono'] text-[11px] px-2.5 py-1 rounded-full border shrink-0"
              style={{ borderColor: `${accent}55`, color: accent, backgroundColor: `${accent}1A` }}
            >
              {chat.agentType.replace('_', ' ')}
            </span>
          )}
        </div>
        <button
          onClick={deleteChat}
          className="font-['JetBrains_Mono'] text-xs text-[#F2665E] hover:bg-[#F2665E]/10 border border-[#F2665E]/30 px-3 py-1.5 rounded-md transition-colors shrink-0"
        >
          delete chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16 sm:py-20">
              <div className="w-14 h-14 rounded-lg border border-[#262C38] bg-[#12161F] flex items-center justify-center mx-auto mb-5">
                <span className="font-['JetBrains_Mono'] text-xl" style={{ color: accent }}>{'>_'}</span>
              </div>
              <p className="font-['Inter'] text-[#E7E9EE] text-base">
                Start a conversation with {chat?.agentType?.replace('_', ' ') || 'your agent'}
              </p>
              <p className="font-['JetBrains_Mono'] text-xs text-[#5B6472] mt-2">
                // responses may take 10–30 seconds
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' ? (
                <div className="max-w-[92%] sm:max-w-[85%] rounded-lg rounded-tl-sm border border-[#262C38] bg-[#12161F] overflow-hidden shadow-sm">
                  <div className="h-[3px]" style={{ backgroundColor: accent }} />
                  <div className="px-4 py-3 font-['Inter'] text-[15px] leading-relaxed text-[#E7E9EE]">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="rounded-md border border-[#262C38] overflow-hidden my-3 -mx-1">
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ margin: 0, background: '#0B0E14', fontSize: '13px' }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code
                              className="bg-[#1A1F2B] text-[#35D0B8] px-1.5 py-0.5 rounded text-[13px] font-['JetBrains_Mono']"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        h1: ({ children }) => (
                          <h1 className="text-lg font-semibold text-[#E7E9EE] mt-4 mb-2 first:mt-0">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-base font-semibold text-[#E7E9EE] mt-4 mb-2 first:mt-0">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-[15px] font-semibold text-[#E7E9EE] mt-3 mb-1.5 first:mt-0">{children}</h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-[#E7E9EE] mb-3 last:mb-0">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-outside pl-5 mb-3 space-y-1 text-[#E7E9EE] marker:text-[#5B6472]">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-outside pl-5 mb-3 space-y-1 text-[#E7E9EE] marker:text-[#5B6472]">{children}</ol>
                        ),
                        li: ({ children }) => <li className="text-[#E7E9EE]">{children}</li>,
                        strong: ({ children }) => (
                          <strong className="font-semibold text-[#E7E9EE]">{children}</strong>
                        ),
                        em: ({ children }) => <em className="text-[#C7CCD6] italic">{children}</em>,
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#35D0B8] hover:underline"
                          >
                            {children}
                          </a>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-[#262C38] pl-3 text-[#9AA3B2] italic my-3">
                            {children}
                          </blockquote>
                        ),
                        hr: () => <hr className="border-[#262C38] my-4" />,
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3 rounded-md border border-[#262C38]">
                            <table className="w-full text-sm border-collapse">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className="bg-[#1A1F2B]">{children}</thead>
                        ),
                        th: ({ children }) => (
                          <th className="text-left text-[#E7E9EE] font-semibold px-3 py-2 border-b border-[#262C38]">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="text-[#C7CCD6] px-3 py-2 border-b border-[#1A1F2B]">{children}</td>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="max-w-[92%] sm:max-w-[75%] rounded-lg rounded-tr-sm border border-[#262C38] bg-[#1A1F2B] px-4 py-3">
                  <p className="font-['Inter'] text-[#E7E9EE] whitespace-pre-wrap text-[15px] leading-relaxed">
                    {message.content}
                  </p>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="border border-[#262C38] bg-[#12161F] rounded-lg px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accent }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.1s]" style={{ backgroundColor: accent }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.2s]" style={{ backgroundColor: accent }} />
                  </div>
                  <span className="font-['JetBrains_Mono'] text-xs text-[#5B6472]">
                    {chat?.agentType?.replace('_', ' ') || 'agent'} is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-[#12161F] border-t border-[#262C38] px-3 sm:px-6 py-3 sm:py-4 shrink-0">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-2 sm:gap-3">
          <div className="flex-1 flex items-center gap-2 bg-[#0B0E14] border border-[#262C38] rounded-md px-3 focus-within:border-[#35D0B8] focus-within:ring-1 focus-within:ring-[#35D0B8]/40 transition-colors">
            <span className="font-['JetBrains_Mono'] text-[#5B6472] text-sm select-none">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-transparent outline-none font-['JetBrains_Mono'] text-sm text-[#E7E9EE] placeholder-[#4B5563] py-2.5"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-[#35D0B8] hover:bg-[#35D0B8]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#0B0E14] font-['JetBrains_Mono'] font-semibold text-sm rounded-md px-4 sm:px-6 flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#0B0E14] border-t-transparent" />
            ) : (
              <>
                <span className="hidden sm:inline">send</span>
                <SendIcon />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;