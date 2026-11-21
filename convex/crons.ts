import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval('process due reminders', { minutes: 1 }, internal.push.sendDue, {});

crons.interval(
  'send daily motivation',
  { minutes: 1 },
  internal.push.sendDailyMotivation,
  {},
);

crons.daily(
  'rebuild reminder horizon',
  { hourUTC: 3, minuteUTC: 10 },
  internal.tasks.rebuildReminders,
  {},
);

crons.hourly(
  'roll up daily stats',
  { minuteUTC: 5 },
  internal.analytics.rollupToday,
  {},
);

export default crons;
