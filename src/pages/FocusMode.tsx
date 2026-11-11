import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { usePomodoro } from '../hooks/usePomodoro';
import { useTasks } from '../hooks/useTasks';
import { useSettings } from '../hooks/useSettings';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const FocusMode: React.FC = () => {
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const pomodoro = usePomodoro(
    workDuration,
    breakDuration,
    (sessions) => {
      playSound();
    }
  );

  const { getTasks } = useTasks();
  const { soundEnabled } = useSettings();
  const tasks = getTasks().filter((t) => !t.completed);

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

  const playSound = () => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const progressPercentage = (
    ((pomodoro.totalTime - pomodoro.timeLeft) / pomodoro.totalTime) * 100
  );

  return (
    <div className="w-full h-screen bg-gradient-to-br from-midnight-900 via-midnight-950 to-lavender-900/20 dark:from-midnight-950 dark:via-midnight-950 dark:to-midnight-900 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-lavender-600/10 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-purple-600/10 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-2xl w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Mode Indicator */}
        <motion.div
          className="text-center mb-8"
          animate={{
            scale: pomodoro.isRunning ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 2, repeat: pomodoro.isRunning ? Infinity : 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-midnight-50 mb-2">
            {pomodoro.isWorkSession ? '🎯 Focus Time' : '☕ Break Time'}
          </h1>
          <p className="text-lavender-300 text-lg">
            {pomodoro.isWorkSession ? 'Stay focused and productive' : 'Take a moment to recharge'}
          </p>
        </motion.div>

        {/* Timer Display */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card
            variant="dark"
            className="p-12 text-center bg-gradient-to-br from-midnight-900/80 to-lavender-900/30 border-2 border-lavender-600/30"
          >
            {/* Progress Ring */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-midnight-800"
                />
                <motion.circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - progressPercentage / 100)}`}
                  className="text-lavender-500"
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-7xl font-bold text-lavender-400 font-mono">
                    {pomodoro.formattedTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Sessions Counter */}
            <p className="text-lavender-300 text-xl mb-4">
              Sessions completed: <span className="font-bold text-lavender-400">{pomodoro.sessionsCompleted}</span>
            </p>
          </Card>
        </motion.div>

        {/* Selected Task */}
        {selectedTask && (
          <motion.div
            className="mb-8 p-4 rounded-xl bg-midnight-800/50 border border-lavender-600/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-lavender-300 mb-1">Current Focus Task:</p>
            <p className="text-lg font-semibold text-midnight-50 truncate">{selectedTask.title}</p>
          </motion.div>
        )}

        {/* Controls */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-8 flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {pomodoro.isRunning ? (
            <Button
              variant="primary"
              size="lg"
              icon={<Pause className="w-5 h-5" />}
              onClick={pomodoro.pause}
            >
              Pause
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              icon={<Play className="w-5 h-5" />}
              onClick={pomodoro.start}
            >
              Start
            </Button>
          )}

          <Button
            variant="secondary"
            size="lg"
            icon={<RotateCcw className="w-5 h-5" />}
            onClick={pomodoro.reset}
          >
            Reset
          </Button>

          <Button
            variant="secondary"
            size="lg"
            icon={<SkipForward className="w-5 h-5" />}
            onClick={pomodoro.skip}
          >
            Skip
          </Button>
        </motion.div>

        {/* Settings Toggle */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? 'Hide Settings' : 'Show Settings'}
          </Button>
        </motion.div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            className="mb-8 p-6 rounded-xl bg-midnight-800/50 border border-lavender-600/30 space-y-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Work Duration (minutes)"
                type="number"
                min="1"
                max="60"
                value={workDuration}
                onChange={(e) => setWorkDuration(Math.max(1, parseInt(e.target.value) || 25))}
              />
              <Input
                label="Break Duration (minutes)"
                type="number"
                min="1"
                max="30"
                value={breakDuration}
                onChange={(e) => setBreakDuration(Math.max(1, parseInt(e.target.value) || 5))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-midnight-300 mb-3">
                Select Focus Task
              </label>
              <select
                value={selectedTaskId || ''}
                onChange={(e) => setSelectedTaskId(e.target.value || null)}
                className="input-field"
              >
                <option value="">None</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="secondary"
              fullWidth
              onClick={() => pomodoro.setCustomDuration(workDuration)}
            >
              Apply Settings
            </Button>
          </motion.div>
        )}

        {/* Tips */}
        <motion.div
          className="text-center text-sm text-lavender-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p>💡 Pro tip: Turn off notifications and close distracting tabs for best results</p>
        </motion.div>
      </motion.div>

      {/* Exit Button */}
      <motion.div
        className="absolute top-6 right-6 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <a href="/" className="text-lavender-300 hover:text-lavender-400 transition-colors">
          ✕ Exit
        </a>
      </motion.div>
    </div>
  );
};

export default FocusMode;
