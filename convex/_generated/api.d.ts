/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as categories from "../categories.js";
import type * as crons from "../crons.js";
import type * as fcm from "../fcm.js";
import type * as focus from "../focus.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_defaults from "../lib/defaults.js";
import type * as lib_fcm from "../lib/fcm.js";
import type * as lib_recurrence from "../lib/recurrence.js";
import type * as lib_reminderPlan from "../lib/reminderPlan.js";
import type * as lib_taskOps from "../lib/taskOps.js";
import type * as lib_time from "../lib/time.js";
import type * as migration from "../migration.js";
import type * as motivation from "../motivation.js";
import type * as notifications from "../notifications.js";
import type * as preferences from "../preferences.js";
import type * as push from "../push.js";
import type * as reminders from "../reminders.js";
import type * as subscriptions from "../subscriptions.js";
import type * as sync from "../sync.js";
import type * as tasks from "../tasks.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  categories: typeof categories;
  crons: typeof crons;
  fcm: typeof fcm;
  focus: typeof focus;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/defaults": typeof lib_defaults;
  "lib/fcm": typeof lib_fcm;
  "lib/recurrence": typeof lib_recurrence;
  "lib/reminderPlan": typeof lib_reminderPlan;
  "lib/taskOps": typeof lib_taskOps;
  "lib/time": typeof lib_time;
  migration: typeof migration;
  motivation: typeof motivation;
  notifications: typeof notifications;
  preferences: typeof preferences;
  push: typeof push;
  reminders: typeof reminders;
  subscriptions: typeof subscriptions;
  sync: typeof sync;
  tasks: typeof tasks;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
