import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useSettings } from '../hooks/useSettings';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import {
  exportToJSON,
  exportToCSV,
  exportToICS,
  downloadFile,
  importFromJSON,
} from '../utils/exportData';

const Settings: React.FC = () => {
  const { getTasks, getCategories, importData } = useTasks();
  const { soundEnabled, notificationsEnabled, updateSettings } = useSettings();
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tasks = getTasks();
  const categories = getCategories();

  const handleExportJSON = () => {
    try {
      const jsonData = exportToJSON(tasks, categories);
      downloadFile(
        jsonData,
        `anantha-tasks-${new Date().toISOString().split('T')[0]}.json`,
        'application/json'
      );
      setExportMessage({ type: 'success', text: 'Tasks exported as JSON successfully!' });
      setTimeout(() => setExportMessage(null), 3000);
    } catch (error) {
      setExportMessage({ type: 'error', text: 'Failed to export JSON' });
    }
  };

  const handleExportCSV = () => {
    try {
      const csvData = exportToCSV(tasks);
      downloadFile(
        csvData,
        `anantha-tasks-${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv'
      );
      setExportMessage({ type: 'success', text: 'Tasks exported as CSV successfully!' });
      setTimeout(() => setExportMessage(null), 3000);
    } catch (error) {
      setExportMessage({ type: 'error', text: 'Failed to export CSV' });
    }
  };

  const handleExportICS = () => {
    try {
      const icsData = exportToICS(tasks);
      downloadFile(
        icsData,
        `anantha-tasks-${new Date().toISOString().split('T')[0]}.ics`,
        'text/calendar'
      );
      setExportMessage({ type: 'success', text: 'Tasks exported as ICS successfully!' });
      setTimeout(() => setExportMessage(null), 3000);
    } catch (error) {
      setExportMessage({ type: 'error', text: 'Failed to export ICS' });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      const { tasks: importedTasks, categories: importedCategories } = importFromJSON(fileContent);

      importData(importedTasks, importedCategories);

      setImportMessage({
        type: 'success',
        text: `Imported ${importedTasks.length} tasks and ${importedCategories.length} categories!`,
      });
      setTimeout(() => setImportMessage(null), 3000);
    } catch (error) {
      setImportMessage({ type: 'error', text: 'Failed to import file. Check the format and try again.' });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      className="p-6 md:p-8 max-w-4xl mx-auto w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-midnight-900 dark:text-midnight-50 mb-2">
          Settings
        </h1>
        <p className="text-midnight-600 dark:text-midnight-400">
          Configure your AnaNthA experience
        </p>
      </motion.div>

      {/* Notifications & Sound */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <Card variant="glass">
          <div className="p-6 border-b border-midnight-200 dark:border-midnight-800">
            <h2 className="text-xl font-semibold text-midnight-900 dark:text-midnight-50">
              Preferences
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-midnight-900 dark:text-midnight-50">Sound Effects</p>
                <p className="text-sm text-midnight-600 dark:text-midnight-400">
                  Play sounds for timer completion
                </p>
              </div>
              <Checkbox
                checked={soundEnabled}
                onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
              />
            </div>

            <div className="border-t border-midnight-200 dark:border-midnight-800 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-midnight-900 dark:text-midnight-50">
                    Browser Notifications
                  </p>
                  <p className="text-sm text-midnight-600 dark:text-midnight-400">
                    Get notifications for reminders
                  </p>
                </div>
                <Checkbox
                  checked={notificationsEnabled}
                  onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
                />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Export Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <Card variant="glass">
          <div className="p-6 border-b border-midnight-200 dark:border-midnight-800">
            <h2 className="text-xl font-semibold text-midnight-900 dark:text-midnight-50 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Your Data
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-midnight-600 dark:text-midnight-400 mb-4">
              Export all your tasks and categories in various formats.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="primary"
                fullWidth
                onClick={handleExportJSON}
                icon={<Download className="w-4 h-4" />}
              >
                Export as JSON
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={handleExportCSV}
                icon={<Download className="w-4 h-4" />}
              >
                Export as CSV
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={handleExportICS}
                icon={<Download className="w-4 h-4" />}
              >
                Export as ICS
              </Button>
            </div>

            {exportMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border flex items-center gap-3 ${
                  exportMessage.type === 'success'
                    ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400'
                    : 'bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-400'
                }`}
              >
                {exportMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm">{exportMessage.text}</p>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Import Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card variant="glass">
          <div className="p-6 border-b border-midnight-200 dark:border-midnight-800">
            <h2 className="text-xl font-semibold text-midnight-900 dark:text-midnight-50 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Your Data
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-midnight-600 dark:text-midnight-400 mb-4">
              Import previously exported JSON files to restore your tasks and categories.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              variant="primary"
              fullWidth
              onClick={handleImportClick}
              icon={<Upload className="w-4 h-4" />}
            >
              Choose File to Import
            </Button>

            {importMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border flex items-center gap-3 ${
                  importMessage.type === 'success'
                    ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400'
                    : 'bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-400'
                }`}
              >
                {importMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm">{importMessage.text}</p>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* About Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8"
      >
        <Card variant="glass">
          <div className="p-6 text-center">
            <h3 className="text-lg font-semibold text-midnight-900 dark:text-midnight-50 mb-2">
              AnaNthA
            </h3>
            <p className="text-sm text-midnight-600 dark:text-midnight-400 mb-4">
              Plan. Progress. Become Infinite. ∞
            </p>
            <p className="text-xs text-midnight-500 dark:text-midnight-500">
              Version 1.0.0 • Built with React, TypeScript & Tailwind CSS
            </p>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Settings;
