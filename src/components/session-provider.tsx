'use client';

import { SessionData } from '@/lib/session';
import { SessionUser } from '@/lib/types';
import { createContext, useContext } from 'react';

type SessionContextType = {
  user: SessionUser | null;
};

const SessionContext = createContext<SessionContextType>({
  user: null,
});

export const useSession = () => useContext(SessionContext);

export default function SessionProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SessionData;
}) {
  return (
    <SessionContext.Provider
      value={{
        user: value.user ?? null,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
