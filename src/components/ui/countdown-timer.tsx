import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string;
  targetTime: string;
  className?: string;
}

export function CountdownTimer({ targetDate, targetTime, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(`${targetDate}T${targetTime}`);
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, targetTime]);

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Clock className="h-4 w-4 text-primary" />
      <div className="flex gap-1">
        {timeLeft.days > 0 && <span className="font-medium">{timeLeft.days}d </span>}
        <span className="font-medium">{String(timeLeft.hours).padStart(2, "0")}:</span>
        <span className="font-medium">{String(timeLeft.minutes).padStart(2, "0")}:</span>
        <span className="font-medium">{String(timeLeft.seconds).padStart(2, "0")}</span>
      </div>
    </div>
  );
}
