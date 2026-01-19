import { useMemo, useEffect, useState } from 'react';

export type SLAStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OVERDUE';

export interface SLAInfo {
  deadline: Date;
  status: SLAStatus;
  timeRemaining: {
    total: number; // milliseconds
    days: number;
    hours: number;
    minutes: number;
  };
  percentageElapsed: number;
}

/**
 * Hook to monitor SLA in real-time
 * Updates every minute to show countdown timer
 */
export function useSLAMonitor(createdAt?: string, deadline?: string): SLAInfo | null {
  const [now, setNow] = useState(new Date());

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    if (!createdAt || !deadline) return null;

    const deadlineDate = new Date(deadline);
    const createdDate = new Date(createdAt);
    const totalDuration = deadlineDate.getTime() - createdDate.getTime();
    const remaining = deadlineDate.getTime() - now.getTime();

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    const percentageElapsed = Math.min(100, Math.max(0, ((totalDuration - remaining) / totalDuration) * 100));

    let status: SLAStatus = 'NORMAL';
    if (remaining < 0) {
      status = 'OVERDUE';
    } else if (remaining < 4 * 60 * 60 * 1000) { // 4 hours
      status = 'CRITICAL';
    } else if (remaining < 24 * 60 * 60 * 1000) { // 1 day
      status = 'WARNING';
    }

    return {
      deadline: deadlineDate,
      status,
      timeRemaining: {
        total: remaining,
        days: Math.max(0, days),
        hours: Math.max(0, hours),
        minutes: Math.max(0, minutes)
      },
      percentageElapsed
    };
  }, [createdAt, deadline, now]);
}
