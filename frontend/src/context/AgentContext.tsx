'use client';

import React, { createContext, useContext } from 'react';

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  commissionRate: number;
  splitPropio: number;
  splitAgent: number;
  salesVolume: number;
  rating: number;
  status: string;
  dateJoined: string;
  idDocument?: string;
  birthDate?: string;
  cityOfResidence?: string;
  aptitude?: number;
  username?: string;
  temporaryPassword?: string;
  password?: string;
}

interface AgentContextType {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children, value }: { children: React.ReactNode; value: AgentContextType }) {
  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgents() {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    // ponytail: safe fallback to prevent runtime crashes when rendered outside AgentProvider
    return { agents: [], setAgents: () => {} };
  }
  return ctx;
}
