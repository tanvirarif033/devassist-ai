import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatApi } from '../api/chat.api';
import type { Chat, AgentType } from '../types';
import toast from 'react-hot-toast';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');`;

type AccentKey = 'teal' | 'amber' | 'blue';

const ACCENTS: Record<AccentKey, { solid: string; soft: string; ring: string }> = {
  teal: { solid: '#35D0B8', soft: 'rgba(53,208,184,0.12)', ring: 'rgba(53,208,184,0.35)' },
  amber: { solid: '#F5A623', soft: 'rgba(245,166,35,0.12)', ring: 'rgba(245,166,35,0.35)' },
  blue: { solid: '#5B9DF9', soft: 'rgba(91,157,249,0.12)', ring: 'rgba(91,157,249,0.35)' },
};

const CodeIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 3 12 9 6" /><polyline points="15 6 21 12 15 18" />
  </svg>
);

const BugIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 6a4 4 0 1 1 8 0" /><rect x="6" y="9" width="12" height="10" rx="5" />
    <line x1="6" y1="13" x2="2" y2="12" /><line x1="18" y1="13" x2="22" y2="12" />
    <line x1="6" y1="18" x2="2" y2="19" /><line x1="18" y1="18" x2="22" y2="19" />
    <line x1="12" y1="9" x2="12" y2="19" />
  </svg>
);

const DbIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
    <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
  </svg>
);

const agents: {
  type: AgentType;
  title: string;
  description: string;
  accent: AccentKey;
  Icon: React.FC<{ color: string }>;
}[] = [
  {
    type: 'code_review' as AgentType,
    title: 'Code Review',
    description: 'Catch bugs, security issues, and style problems before they ship.',
    accent: 'teal',
    Icon: CodeIcon,
  },
  {
    type: 'bug_fix' as AgentType,
    title: 'Bug Fix',
    description: 'Paste an error and get a step-by-step diagnosis and fix.',
    accent: 'amber',
    Icon: BugIcon,
  },
  {
    type: 'sql_generator' as AgentType,
    title: 'SQL Generator',
    description: 'Describe what you need in plain language, get the query.',
    accent: 'blue',
    Icon: DbIcon,
  },
];

const accentFor = (type: string): AccentKey => {
  const match = agents.find((a) => a.type === type);
  return match?.accent ?? 'teal';
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const chats = await chatApi.getChats();
      setRecentChats(chats.slice(0, 5));
    } catch (error) {
      toast.error('Could not load your chats. Try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (agentType: AgentType) => {
    try {
      const title = `${agentType.replace('_', ' ').toUpperCase()} - ${new Date().toLocaleString()}`;
      const chat = await chatApi.createChat({ title, agentType });
      navigate(`/chat/${chat.id}`);
    } catch (error) {
      toast.error('Could not start a new chat. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <style>{FONT_IMPORT}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Welcome */}
        <div className="mb-10">
          <p className="font-['JetBrains_Mono'] text-xs text-[#35D0B8] mb-2">// dashboard</p>
          <h1 className="font-['Inter'] text-2xl sm:text-3xl font-bold text-[#E7E9EE]">
            Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
          </h1>
          <p className="font-['Inter'] text-[#9AA3B2] mt-1.5 text-sm sm:text-base">
            Choose an agent to help with your next task.
          </p>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {agents.map((agent) => {
            const c = ACCENTS[agent.accent];
            return (
              <div
                key={agent.type}
                onClick={() => createChat(agent.type)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && createChat(agent.type)}
                className="group rounded-lg border border-[#262C38] bg-[#12161F] p-6 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-[#363E4D] hover:shadow-lg hover:shadow-black/30 focus:outline-none focus:ring-2"
                style={{ ['--tw-ring-color' as any]: c.ring }}
              >
                <div
                  className="w-11 h-11 rounded-md border border-[#262C38] flex items-center justify-center mb-4 transition-colors"
                  style={{ backgroundColor: c.soft }}
                >
                  <agent.Icon color={c.solid} />
                </div>
                <h3 className="font-['Inter'] text-base font-semibold text-[#E7E9EE]">{agent.title}</h3>
                <p className="font-['Inter'] text-sm text-[#9AA3B2] mt-1.5 leading-relaxed">
                  {agent.description}
                </p>
                <div className="mt-5 pt-4 border-t border-[#1A1F2B] flex items-center gap-1.5">
                  <span className="font-['JetBrains_Mono'] text-xs font-medium" style={{ color: c.solid }}>
                    + new chat
                  </span>
                  <span
                    className="font-['JetBrains_Mono'] text-xs transition-transform group-hover:translate-x-0.5"
                    style={{ color: c.solid }}
                  >
                    →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent chats */}
        <div className="rounded-lg border border-[#262C38] bg-[#12161F]">
          <div className="px-5 sm:px-6 py-4 border-b border-[#262C38]">
            <p className="font-['JetBrains_Mono'] text-xs text-[#35D0B8] mb-1">// recent activity</p>
            <h2 className="font-['Inter'] text-lg font-semibold text-[#E7E9EE]">Recent chats</h2>
          </div>

          <div className="px-2 sm:px-4 py-2">
            {loading ? (
              <div className="space-y-2 py-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-md bg-[#1A1F2B] animate-pulse" />
                ))}
              </div>
            ) : recentChats.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="font-['JetBrains_Mono'] text-xs text-[#5B6472] mb-2">// no chats yet</p>
                <p className="font-['Inter'] text-[#9AA3B2] text-sm">
                  Start a chat with an agent above to get going.
                </p>
              </div>
            ) : (
              <div>
                {recentChats.map((chat) => {
                  const c = ACCENTS[accentFor(chat.agentType)];
                  return (
                    <div
                      key={chat.id}
                      onClick={() => navigate(`/chat/${chat.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/chat/${chat.id}`)}
                      className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3.5 rounded-md hover:bg-[#1A1F2B] cursor-pointer transition-colors border-b border-[#1A1F2B] last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: c.solid }}
                        />
                        <div className="min-w-0">
                          <p className="font-['Inter'] font-medium text-[#E7E9EE] text-sm truncate">
                            {chat.title}
                          </p>
                          <p className="font-['JetBrains_Mono'] text-[11px] text-[#5B6472] mt-0.5">
                            {new Date(chat.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className="font-['JetBrains_Mono'] text-[11px] px-2.5 py-1 rounded-full border shrink-0"
                        style={{ borderColor: c.ring, color: c.solid, backgroundColor: c.soft }}
                      >
                        {chat.agentType.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;