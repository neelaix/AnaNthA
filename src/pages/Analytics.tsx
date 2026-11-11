import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAnalytics } from '../hooks/useAnalytics';
import Card from '../components/ui/Card';
import StatCard from '../components/widgets/StatCard';
import { TrendingUp, Target, Flame, Calendar } from 'lucide-react';

const Analytics: React.FC = () => {
  const analytics = useAnalytics();

  // Prepare data for charts
  const weeklyData = analytics.weeklyCompletion.map((completion, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - idx));
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      completion: Math.round(completion),
    };
  });

  const monthlyData = analytics.monthlyCompletion.map((completion, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - idx));
    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completion: Math.round(completion),
    };
  });

  const categoryData = analytics.categoryStats.map((stat) => ({
    name: stat.categoryName,
    value: stat.percentage,
    completed: stat.completedCount,
    total: stat.totalCount,
  }));

  const COLORS = [
    '#9d88ff',
    '#7d5fff',
    '#4c6ef5',
    '#15aabf',
    '#51cf66',
    '#ffd43b',
    '#ff922b',
    '#ff6b6b',
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      className="p-6 md:p-8 max-w-7xl mx-auto w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="mb-8"
        variants={itemVariants}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-midnight-900 dark:text-midnight-50 mb-2">
          Analytics
        </h1>
        <p className="text-midnight-600 dark:text-midnight-400">
          Track your productivity and task completion trends
        </p>
      </motion.div>

      {/* Top Stats */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={itemVariants}
      >
        <StatCard
          icon={<Target />}
          label="Total Tasks"
          value={analytics.totalTasks}
          color="lavender"
        />
        <StatCard
          icon={<TrendingUp />}
          label="Completed"
          value={analytics.completedTasks}
          color="green"
          subtext={`${Math.round((analytics.completedTasks / (analytics.totalTasks || 1)) * 100)}% done`}
        />
        <StatCard
          icon={<Flame />}
          label="Current Streak"
          value={`${analytics.currentStreak} days`}
          color="orange"
        />
        <StatCard
          icon={<Calendar />}
          label="Best Day"
          value={analytics.bestProductiveDay}
          color="blue"
        />
      </motion.div>

      {/* Charts Grid */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" variants={itemVariants}>
        {/* Weekly Completion Chart */}
        <Card variant="glass" className="p-6">
          <h3 className="text-lg font-semibold text-midnight-900 dark:text-midnight-50 mb-4">
            Weekly Completion Rate
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(26, 26, 46, 0.9)',
                  border: '1px solid rgba(157, 136, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                }}
              />
              <Line
                type="monotone"
                dataKey="completion"
                stroke="#9d88ff"
                strokeWidth={2}
                dot={{ fill: '#9d88ff', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Breakdown Pie Chart */}
        {categoryData.length > 0 && (
          <Card variant="glass" className="p-6">
            <h3 className="text-lg font-semibold text-midnight-900 dark:text-midnight-50 mb-4">
              Tasks by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(26, 26, 46, 0.9)',
                    border: '1px solid rgba(157, 136, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </motion.div>

      {/* Monthly Trend */}
      <motion.div variants={itemVariants}>
        <Card variant="glass" className="p-6">
          <h3 className="text-lg font-semibold text-midnight-900 dark:text-midnight-50 mb-4">
            Monthly Completion Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(26, 26, 46, 0.9)',
                  border: '1px solid rgba(157, 136, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                }}
              />
              <Bar dataKey="completion" fill="#9d88ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Category Details Table */}
      {categoryData.length > 0 && (
        <motion.div className="mt-8" variants={itemVariants}>
          <Card variant="glass" className="p-6">
            <h3 className="text-lg font-semibold text-midnight-900 dark:text-midnight-50 mb-4">
              Category Statistics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-midnight-200 dark:border-midnight-700">
                    <th className="text-left py-3 px-4 font-semibold text-midnight-900 dark:text-midnight-50">
                      Category
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-midnight-900 dark:text-midnight-50">
                      Completed
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-midnight-900 dark:text-midnight-50">
                      Total
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-midnight-900 dark:text-midnight-50">
                      Completion %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((cat, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-midnight-100 dark:border-midnight-800 hover:bg-midnight-100 dark:hover:bg-midnight-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-midnight-900 dark:text-midnight-50 font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          {cat.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-midnight-600 dark:text-midnight-400">
                        {cat.completed}
                      </td>
                      <td className="py-3 px-4 text-center text-midnight-600 dark:text-midnight-400">
                        {cat.total}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="bg-gradient-to-r from-lavender-600/20 to-midnight-700/20 rounded px-3 py-1 inline-block">
                          <span className="font-semibold text-lavender-600 dark:text-lavender-400">
                            {cat.value.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {analytics.totalTasks === 0 && (
        <motion.div variants={itemVariants}>
          <Card variant="glass" className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-lavender-500 mx-auto mb-4 opacity-50" />
            <p className="text-midnight-600 dark:text-midnight-400">
              Start creating tasks to see your analytics!
            </p>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Analytics;
