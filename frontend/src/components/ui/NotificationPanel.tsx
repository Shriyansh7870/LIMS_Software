import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertTriangle, Award, ClipboardCheck, TestTube, X, Check } from 'lucide-react';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const typeIconMap: Record<string, { icon: typeof Bell; color: string }> = {
  cert_expiry_critical: { icon: Award, color: '#DC2626' },
  cert_expiry_warning:  { icon: Award, color: '#D97706' },
  capa_deadline_critical: { icon: AlertTriangle, color: '#DC2626' },
  capa_overdue:         { icon: AlertTriangle, color: '#D97706' },
  test_request_submitted: { icon: TestTube, color: '#2563EB' },
  audit_finding_critical: { icon: ClipboardCheck, color: '#DC2626' },
  workflow_update:      { icon: ClipboardCheck, color: '#C49A2C' },
  system:               { icon: Bell, color: '#6899A0' },
};

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data.data as Notification[];
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <motion.div
      data-testid="notification-panel"
      className="fixed top-14 right-4 w-80 bg-card rounded-xl border border-border shadow-2xl z-40 overflow-hidden"
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-syne font-semibold text-sm text-text">Notifications</h3>
        <button onClick={onClose} className="text-text-dim hover:text-text transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {isLoading && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-card2 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 bg-card2 rounded w-3/4" />
                  <div className="h-2 bg-card2 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}
        {data?.length === 0 && (
          <div className="py-8 text-center">
            <Bell size={24} className="text-text-dim mx-auto mb-2" />
            <p className="text-sm text-text-muted">All caught up!</p>
          </div>
        )}
        {data?.map((notif) => {
          const cfg = typeIconMap[notif.type] || typeIconMap.system;
          const Icon = cfg.icon;
          return (
            <div key={notif.id}
              className={`flex gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${notif.isRead ? 'opacity-60' : 'bg-teal/[0.03]'}`}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${cfg.color}18` }}>
                <Icon size={13} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text leading-tight">{notif.title}</p>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notif.message}</p>
                <p className="text-[10px] text-text-dim mt-1">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!notif.isRead && (
                <button onClick={() => markRead.mutate(notif.id)}
                  className="text-text-dim hover:text-teal transition-colors flex-shrink-0 mt-0.5" title="Mark as read">
                  <Check size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-border text-center">
        <button className="text-xs text-teal hover:text-teal-dark transition-colors font-medium">
          View all notifications
        </button>
      </div>
    </motion.div>
  );
}
