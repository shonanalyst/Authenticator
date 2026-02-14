import React, { createContext, useContext, useState, useEffect } from 'react';

const PERIOD = 30;

interface TimerState {
  unixTime: number;
  secondsRemaining: number;
  progress: number;
}

function computeTimer(): TimerState {
  const unixTime = Math.floor(Date.now() / 1000);
  const secondsRemaining = PERIOD - (unixTime % PERIOD);
  const progress = (PERIOD - secondsRemaining) / PERIOD;
  return { unixTime, secondsRemaining, progress };
}

const TimerContext = createContext<TimerState>(computeTimer());

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TimerState>(computeTimer);

  useEffect(() => {
    setState(computeTimer());
    const id = setInterval(() => setState(computeTimer()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <TimerContext.Provider value={state}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer(): TimerState {
  return useContext(TimerContext);
}
