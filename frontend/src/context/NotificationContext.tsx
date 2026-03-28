import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  refetchCount: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refetchCount: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count');
      return data.data as { count: number };
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const refetchCount = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <NotificationContext.Provider value={{ unreadCount: data?.count || 0, refetchCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
