'use client';

import { CheckCircle, Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Story 6.6: Connection state type for realtime subscriptions
 * Maps to Supabase channel subscription statuses:
 * - 'connecting' → initial state, waiting for SUBSCRIBED
 * - 'connected' → SUBSCRIBED received
 * - 'disconnected' → CHANNEL_ERROR or CLOSED received
 * - 'reconnecting' → TIMED_OUT received (attempting reconnect)
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface ConnectionIndicatorProps {
  state: ConnectionState;
  className?: string;
}

/**
 * Configuration for each connection state
 * AC-6.6.4: Connected state is subtle (muted colors) to not distract
 * Disconnected/reconnecting are more prominent to alert user
 */
const indicators: Record<ConnectionState, {
  icon: typeof CheckCircle;
  text: string;
  color: string;
  spin: boolean;
}> = {
  connecting: {
    icon: Loader2,
    text: 'Connecting...',
    color: 'text-slate-400',
    spin: true,
  },
  connected: {
    icon: CheckCircle,
    text: 'Connected',
    color: 'text-emerald-600',
    spin: false,
  },
  disconnected: {
    icon: WifiOff,
    text: 'Offline',
    color: 'text-red-500',
    spin: false,
  },
  reconnecting: {
    icon: RefreshCw,
    text: 'Reconnecting...',
    color: 'text-amber-500',
    spin: true,
  },
};

/**
 * Connection status indicator component
 *
 * Story 6.6: Displays current realtime connection state
 * - AC-6.6.1: Shows "Connected" with green checkmark when realtime connected
 * - AC-6.6.2: Shows "Connecting..." with spinner during connection
 * - AC-6.6.3: Shows "Offline" when disconnected
 * - AC-6.6.4: Subtle, non-distracting appearance (small text, muted when connected)
 * - AC-6.6.5: Shows "Reconnecting..." during auto-reconnect attempts
 */
export function ConnectionIndicator({ state, className }: ConnectionIndicatorProps) {
  const config = indicators[state];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs',
        config.color,
        className
      )}
      role="status"
      aria-live="polite"
      data-testid="connection-indicator"
      data-state={state}
    >
      <Icon
        className={cn('h-3 w-3', config.spin && 'animate-spin')}
        aria-hidden="true"
      />
      <span>{config.text}</span>
    </div>
  );
}
