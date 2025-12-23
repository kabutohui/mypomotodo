import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  duration: number; // 分钟
  isActive: boolean;
  onComplete: () => void;
  onStop: () => void;
  className?: string;
}

export function PomodoroTimer({
  duration,
  isActive,
  onComplete,
  onStop,
  className,
}: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(false);

  // 重置计时器
  useEffect(() => {
    if (isActive) {
      setTimeLeft(duration * 60);
      setIsRunning(false);
    }
  }, [duration, isActive]);

  // 计时逻辑
  useEffect(() => {
    if (!isActive || !isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isRunning, onComplete]);

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
    onStop();
  }, [duration, onStop]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  if (!isActive) return null;

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-48 h-48">
          {/* 进度圆环 */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
              className="text-primary transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          {/* 时间显示 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Timer className="h-8 w-8 text-primary mb-2" />
            <span className="text-4xl font-mono font-bold text-foreground">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleTimer}
            size="lg"
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                暂停
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                开始
              </>
            )}
          </Button>
          <Button
            onClick={resetTimer}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Square className="h-5 w-5" />
            停止
          </Button>
        </div>
      </div>
    </Card>
  );
}
