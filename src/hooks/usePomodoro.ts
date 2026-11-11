import { useState, useEffect, useCallback, useRef } from 'react';

export interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  isWorkSession: boolean;
  sessionsCompleted: number;
  totalTime: number;
}

export const usePomodoro = (
  workDuration: number = 25,
  breakDuration: number = 5,
  onSessionComplete?: (sessionsCompleted: number) => void
) => {
  const [state, setState] = useState<PomodoroState>({
    timeLeft: workDuration * 60,
    isRunning: false,
    isWorkSession: true,
    sessionsCompleted: 0,
    totalTime: workDuration * 60,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prevState) => {
        if (prevState.timeLeft <= 1) {
          // Session complete
          const isWorkSession = prevState.isWorkSession;
          const newSessionsCompleted = isWorkSession ? prevState.sessionsCompleted + 1 : prevState.sessionsCompleted;
          const nextIsWorkSession = !isWorkSession;
          const nextDuration = nextIsWorkSession ? workDuration : breakDuration;

          if (isWorkSession) {
            onSessionComplete?.(newSessionsCompleted);
          }

          return {
            timeLeft: nextDuration * 60,
            isRunning: false,
            isWorkSession: nextIsWorkSession,
            sessionsCompleted: newSessionsCompleted,
            totalTime: nextDuration * 60,
          };
        }

        return {
          ...prevState,
          timeLeft: prevState.timeLeft - 1,
        };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, workDuration, breakDuration, onSessionComplete]);

  const start = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      isRunning: true,
    }));
  }, []);

  const pause = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      isRunning: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      timeLeft: workDuration * 60,
      isRunning: false,
      isWorkSession: true,
      sessionsCompleted: 0,
      totalTime: workDuration * 60,
    });
  }, [workDuration]);

  const skip = useCallback(() => {
    setState((prevState) => {
      const nextIsWorkSession = !prevState.isWorkSession;
      const nextDuration = nextIsWorkSession ? workDuration : breakDuration;
      const newSessionsCompleted = !prevState.isWorkSession ? prevState.sessionsCompleted + 1 : prevState.sessionsCompleted;

      return {
        timeLeft: nextDuration * 60,
        isRunning: false,
        isWorkSession: nextIsWorkSession,
        sessionsCompleted: newSessionsCompleted,
        totalTime: nextDuration * 60,
      };
    });
  }, [workDuration, breakDuration]);

  const setCustomDuration = useCallback((minutes: number) => {
    setState({
      timeLeft: minutes * 60,
      isRunning: false,
      isWorkSession: true,
      sessionsCompleted: 0,
      totalTime: minutes * 60,
    });
  }, []);

  return {
    ...state,
    start,
    pause,
    reset,
    skip,
    setCustomDuration,
    formattedTime: `${String(Math.floor(state.timeLeft / 60)).padStart(2, '0')}:${String(state.timeLeft % 60).padStart(2, '0')}`,
  };
};
