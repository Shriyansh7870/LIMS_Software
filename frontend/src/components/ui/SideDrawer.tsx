import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: number;
  footer?: React.ReactNode;
}

export default function SideDrawer({ isOpen, onClose, title, subtitle, children, width = 480, footer }: SideDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-card border-l border-border shadow-2xl flex flex-col h-full"
        style={{ width }}
        initial={{ x: width }}
        animate={{ x: 0 }}
        exit={{ x: width }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-syne font-bold text-lg text-text">{title}</h2>
            {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-bg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border flex-shrink-0">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}
