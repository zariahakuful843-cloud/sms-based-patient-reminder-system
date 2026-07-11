"use client";

import { createContext, useContext, type ReactNode } from "react";
import { can as rbacCan, canSendReminderType as rbacCanSend, type Permission } from "./rbac";

export type ClientSession = {
  userId: number;
  username: string;
  name: string;
  role: string;
  departmentId?: number | null;
  department?: string | null;
};

const SessionContext = createContext<ClientSession | null>(null);

export function SessionProvider({
  value,
  children,
}: {
  value: ClientSession;
  children: ReactNode;
}) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): ClientSession {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return session;
}

// Convenience hook: `const can = useCan(); can("patients.create")`.
export function useCan(): (permission: Permission) => boolean {
  const { role } = useSession();
  return (permission: Permission) => rbacCan(role, permission);
}

export function useCanSendReminder(): (reminderType: string) => boolean {
  const { role } = useSession();
  return (reminderType: string) => rbacCanSend(role, reminderType);
}
