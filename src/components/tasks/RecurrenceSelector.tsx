import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { RecurrenceRule } from '../../types';
import { Button, Input, Select, Checkbox } from '../ui';
import { cn } from '../../utils/cn';

interface RecurrenceSelectorProps {
  value?: RecurrenceRule;
  onChange: (rule: RecurrenceRule | undefined) => void;
}

const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>(
    value?.frequency || 'weekly'
  );
  const [interval, setInterval] = useState(value?.interval || 1);
  const [endDate, setEndDate] = useState(value?.endDate ? value.endDate.toString().split('T')[0] : '');
  const [maxOccurrences, setMaxOccurrences] = useState(value?.maxOccurrences || 0);
  const [selectedDays, setSelectedDays] = useState<number[]>(value?.daysOfWeek || []);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleToggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleApply = () => {
    const newRule: RecurrenceRule = {
      frequency,
      interval: Math.max(1, interval),
      daysOfWeek: frequency === 'weekly' ? selectedDays : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      maxOccurrences: maxOccurrences > 0 ? maxOccurrences : undefined,
    };

    onChange(newRule);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
    setFrequency('weekly');
    setInterval(1);
    setEndDate('');
    setMaxOccurrences(0);
    setSelectedDays([]);
  };

  const getRecurrenceDescription = (): string => {
    if (!value) return 'No recurrence';

    let desc = `Repeats ${value.frequency}`;
    if (value.interval && value.interval > 1) {
      desc += ` every ${value.interval}`;
    }

    if (value.daysOfWeek && value.daysOfWeek.length > 0) {
      const dayNames = value.daysOfWeek.map((d) => dayLabels[d]).join(', ');
      desc += ` on ${dayNames}`;
    }

    if (value.endDate) {
      desc += ` until ${value.endDate.toLocaleDateString()}`;
    } else if (value.maxOccurrences) {
      desc += ` for ${value.maxOccurrences} times`;
    }

    return desc;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-midnight-900 dark:text-midnight-50">
        Recurrence
      </label>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-2 rounded-lg border-2 transition-all text-left flex items-center justify-between',
          value
            ? 'border-lavender-500 bg-lavender-50 dark:bg-midnight-800 text-midnight-900 dark:text-midnight-50'
            : 'border-midnight-200 dark:border-midnight-700 bg-midnight-50 dark:bg-midnight-900 text-midnight-700 dark:text-midnight-300 hover:border-lavender-400'
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-midnight-600 dark:text-midnight-400">
            {getRecurrenceDescription()}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-midnight-100 dark:bg-midnight-800 border border-midnight-200 dark:border-midnight-700 space-y-4"
          >
            {/* Frequency Selection */}
            <div>
              <label className="text-xs font-semibold text-midnight-900 dark:text-midnight-50 mb-2 block">
                Repeat Pattern
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['daily', 'weekly', 'monthly', 'yearly', 'custom'].map((freq) => (
                  <motion.button
                    key={freq}
                    onClick={() => {
                      setFrequency(freq as any);
                      if (freq !== 'weekly') setSelectedDays([]);
                    }}
                    className={cn(
                      'px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                      frequency === freq
                        ? 'bg-lavender-600 text-white'
                        : 'bg-midnight-200 dark:bg-midnight-700 text-midnight-700 dark:text-midnight-300 hover:bg-midnight-300 dark:hover:bg-midnight-600'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Interval */}
            <div>
              <label className="text-xs font-semibold text-midnight-900 dark:text-midnight-50 mb-2 block">
                Every
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={interval}
                  onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20"
                />
                <span className="text-sm text-midnight-600 dark:text-midnight-400">
                  {frequency === 'daily' && 'day(s)'}
                  {frequency === 'weekly' && 'week(s)'}
                  {frequency === 'monthly' && 'month(s)'}
                  {frequency === 'yearly' && 'year(s)'}
                  {frequency === 'custom' && 'interval(s)'}
                </span>
              </div>
            </div>

            {/* Days of Week (Weekly Only) */}
            {frequency === 'weekly' && (
              <div>
                <label className="text-xs font-semibold text-midnight-900 dark:text-midnight-50 mb-2 block">
                  On These Days
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {dayLabels.map((day, idx) => (
                    <motion.button
                      key={day}
                      onClick={() => handleToggleDay(idx)}
                      className={cn(
                        'px-2 py-2 rounded-lg text-xs font-semibold transition-all',
                        selectedDays.includes(idx)
                          ? 'bg-lavender-500 text-white'
                          : 'bg-midnight-200 dark:bg-midnight-700 text-midnight-700 dark:text-midnight-300 hover:bg-midnight-300 dark:hover:bg-midnight-600'
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {day}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* End Options */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-midnight-900 dark:text-midnight-50 mb-2 block">
                  End Date (Optional)
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setMaxOccurrences(0);
                  }}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-midnight-900 dark:text-midnight-50 mb-2 block">
                  Max Occurrences (Optional)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={maxOccurrences}
                  onChange={(e) => {
                    setMaxOccurrences(Math.max(0, parseInt(e.target.value) || 0));
                    setEndDate('');
                  }}
                  placeholder="Unlimited"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApply}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecurrenceSelector;
