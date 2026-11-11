import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatDate, formatTime } from '../../utils/dateHelpers';

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);

      const hour = now.getHours();
      if (hour < 12) {
        setGreeting('Good Morning');
      } else if (hour < 18) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h1 className="text-5xl font-bold text-midnight-900 dark:text-midnight-50 mb-2">
        {greeting}
      </h1>
      <div className="flex items-baseline gap-4">
        <p className="text-2xl font-semibold text-lavender-600 dark:text-lavender-400">
          {formatTime(time, 'HH:mm:ss')}
        </p>
        <p className="text-lg text-midnight-600 dark:text-midnight-400">
          {formatDate(time, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>
    </motion.div>
  );
};

export default LiveClock;
