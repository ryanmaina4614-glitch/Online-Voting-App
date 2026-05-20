import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
}

export default function CountdownTimer({ endDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date();
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isOver: false
      };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  if (timeLeft.isOver) {
    return (
      <span className="text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
        Ended
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-indigo-600 font-mono text-sm font-black">
      <Clock className="w-3.5 h-3.5" />
      <div className="flex gap-0.5">
        {timeLeft.days > 0 && (
          <span className="tabular-nums">{timeLeft.days}d</span>
        )}
        <span className="tabular-nums">
          {timeLeft.hours.toString().padStart(2, '0')}h:
          {timeLeft.minutes.toString().padStart(2, '0')}m:
          {timeLeft.seconds.toString().padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
}
