import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import { Quote } from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
  {
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
  },
  {
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
  },
  {
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
  },
  {
    text: 'It does not matter how slowly you go as long as you do not stop.',
    author: 'Confucius',
  },
  {
    text: 'Believe you can and you\'re halfway there.',
    author: 'Theodore Roosevelt',
  },
  {
    text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    author: 'Chinese Proverb',
  },
  {
    text: 'Don\'t watch the clock; do what it does. Keep going.',
    author: 'Sam Levenson',
  },
  {
    text: 'Your limitation—it\'s only your imagination. Push past it.',
    author: 'Unknown',
  },
  {
    text: 'Great things never come from comfort zones.',
    author: 'Unknown',
  },
  {
    text: 'Dream it. Believe it. Build it.',
    author: 'Unknown',
  },
];

const QuoteWidget: React.FC = () => {
  const todayQuote = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ y: -4 }}
    >
      <Card
        variant="dark"
        className="p-8 bg-gradient-to-br from-midnight-900/80 via-lavender-900/30 to-midnight-900/80 border border-lavender-600/20"
      >
        <div className="flex gap-4">
          <Quote className="w-6 h-6 text-lavender-400 flex-shrink-0 mt-1" />
          <div>
            <p className="text-lg font-medium text-midnight-50 italic mb-4">
              "{todayQuote.text}"
            </p>
            <p className="text-sm text-lavender-300">— {todayQuote.author}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default QuoteWidget;
