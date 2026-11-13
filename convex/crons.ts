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

export default crons;
