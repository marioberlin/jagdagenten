import React, { useMemo } from 'react';
import { AgSidebar } from '@/components/generative/AgSidebar';
import { RemoteAgentService } from '@/services/a2a/RemoteAgentService';

const REMOTE_URL = 'https://wr-demo.showheroes.com/api/v1/a2a/636a315d-a83a-4308-b9c2-2d1a6ba590ee/';
const REMOTE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYjc3ZWNlYS0wZGQ3LTRmMDUtYjAwMy0yNDcwNzVkMTdjODkiLCJhZ2VudF9pZCI6IjYzNmEzMTVkLWE4M2EtNDMwOC1iOWMyLTJkMWE2YmE1OTBlZSIsIm1vZGUiOiJjb252ZXJzYXRpb24iLCJzY29wZSI6ImxpbWl0ZWQiLCJ0b2tlbl90eXBlIjoiYWdlbnQiLCJleHAiOjE5MjYzMzUzNzR9.4XwjmQW6NJxLH55KgDtsBxcfDsY2WRmg_-9yNmUd1B4';

const RemotePasswordDemo: React.FC = () => {
    // Initialize the remote service with the provided credentials
    const remoteService = useMemo(() => {
        return new RemoteAgentService(REMOTE_URL, REMOTE_TOKEN, 'demo-session');
    }, []);

    return (
        <div className="flex h-screen w-full bg-[#050510] text-white">
            <AgSidebar
                initialService={remoteService}
                initialMessage="Hello! I can generate secure passwords for you. Just ask!"
            />

            <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-2xl text-center space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h1 className="text-4xl font-light tracking-tight">
                        Remote <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 font-medium">Password Agent</span>
                    </h1>

                    <p className="text-lg text-white/60">
                        This demo connects to a remote A2A server running a Password Generator agent.
                        <br />
                        Ask specifically for a password (e.g., "Generate a strong password").
                    </p>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-sm font-mono text-left">
                        <div className="flex items-center gap-2 mb-2 text-xs text-white/40 uppercase tracking-wider">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            Connected To
                        </div>
                        <div className="truncate text-purple-300">{REMOTE_URL}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RemotePasswordDemo;
