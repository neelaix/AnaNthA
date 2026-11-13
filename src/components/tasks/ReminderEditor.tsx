import React, { useState } from 'react';
import { Bell, Plus, X } from 'lucide-react';
import type { ReminderConfig, ReminderPriority, ReminderRepeat } from '../../types';
import { REMINDER_OFFSETS, formatOffset } from '../../utils/reminderEngine';
import { cn } from '../../utils/cn';
import Toggle from '../ui/Toggle';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

interface ReminderEditorProps {
  value: ReminderConfig;
  onChange: (next: ReminderConfig) => void;
  deadline?: string;
  time?: string;
  defaultMinutes: number;
}

const ReminderEditor: React.FC<ReminderEditorProps> = ({
  value,
  onChange,
  deadline,
  time,
  defaultMinutes,
}) => {
  const [customOffset, setCustomOffset] = useState('');

  const update = (patch: Partial<ReminderConfig>) => onChange({ ...value, ...patch });

  const toggleOffset = (minutes: number) => {
    const offsets = value.offsets.includes(minutes)
      ? value.offsets.filter((item) => item !== minutes)
      : [...value.offsets, minutes].sort((a, b) => b - a);
    update({ offsets });
  };

  const addCustomOffset = () => {
    const minutes = Math.max(1, Math.min(10080, Math.round(Number(customOffset))));
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    if (!value.offsets.includes(minutes)) {
      update({ offsets: [...value.offsets, minutes].sort((a, b) => b - a) });
    }
    setCustomOffset('');
  };

  const customOffsets = value.offsets.filter((offset) => !REMINDER_OFFSETS.includes(offset));

  return (
    <div className="rounded-2xl border border-lavender-200/70 dark:border-midnight-700 bg-lavender-50/60 dark:bg-midnight-800/40 overflow-hidden">
      <div className="p-4">
        <Toggle
          checked={value.enabled}
          onChange={(enabled) =>
            update({
              enabled,
              time: value.time || time || '09:00',
              date: value.date || deadline || '',
              offsets: value.offsets.length ? value.offsets : [defaultMinutes],
            })
          }
          label="Smart reminder"
          description="Push notifications even when ANAṆTHA is closed"
        />
      </div>

      {value.enabled && (
        <div className="px-4 pb-5 space-y-4 border-t border-lavender-200/70 dark:border-midnight-700 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Reminder date"
              type="date"
              value={value.date ?? ''}
              onChange={(event) => update({ date: event.target.value })}
            />
            <Input
              label="Reminder time"
              type="time"
              value={value.time ?? ''}
              onChange={(event) => update({ time: event.target.value })}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-midnight-700 dark:text-midnight-300 mb-2">
              Remind me before the deadline
            </p>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OFFSETS.map((offset) => (
                <button
                  key={offset}
                  type="button"
                  onClick={() => toggleOffset(offset)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                    value.offsets.includes(offset)
                      ? 'bg-gradient-to-r from-lavender-600 to-midnight-700 text-white border-transparent shadow-glow'
                      : 'bg-white/70 dark:bg-midnight-900/60 text-midnight-700 dark:text-midnight-300 border-midnight-200 dark:border-midnight-700 hover:border-lavender-400',
                  )}
                >
                  {formatOffset(offset)}
                </button>
              ))}
              {customOffsets.map((offset) => (
                <button
                  key={offset}
                  type="button"
                  onClick={() => toggleOffset(offset)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-lavender-600 to-midnight-700 text-white"
                >
                  {formatOffset(offset)}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Input
                type="number"
                min={1}
                max={10080}
                placeholder="Custom minutes"
                value={customOffset}
                onChange={(event) => setCustomOffset(event.target.value)}
                className="max-w-[160px]"
              />
              <button
                type="button"
                onClick={addCustomOffset}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm font-semibold bg-midnight-100 dark:bg-midnight-800 text-midnight-800 dark:text-midnight-100 hover:bg-midnight-200 dark:hover:bg-midnight-700"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-midnight-700 dark:text-midnight-300 cursor-pointer">
            <input
              type="checkbox"
              checked={value.notifyAtDeadline}
              onChange={(event) => update({ notifyAtDeadline: event.target.checked })}
              className="w-4 h-4 rounded border-midnight-300 dark:border-midnight-600 text-lavender-600 focus:ring-lavender-500"
            />
            Also notify exactly at the deadline
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Notification priority"
              value={value.priority}
              onChange={(event) => update({ priority: event.target.value as ReminderPriority })}
              options={[
                { value: 'low', label: 'Low — gentle' },
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High — bypass quiet hours' },
              ]}
            />
            <Select
              label="Repeat"
              value={value.repeat}
              onChange={(event) => update({ repeat: event.target.value as ReminderRepeat })}
              options={[
                { value: 'none', label: 'Does not repeat' },
                { value: 'daily', label: 'Every day' },
                { value: 'weekly', label: 'Every week' },
                { value: 'monthly', label: 'Every month' },
              ]}
            />
          </div>

          <Textarea
            label="Custom notification message (optional)"
            placeholder="e.g. Don't forget your study session!"
            rows={2}
            maxLength={280}
            value={value.message ?? ''}
            onChange={(event) => update({ message: event.target.value })}
          />

          <p className="flex items-center gap-2 text-xs text-midnight-500 dark:text-midnight-400">
            <Bell className="w-3.5 h-3.5" />
            Reminders are scheduled on the server and delivered even when this website is closed.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReminderEditor;
