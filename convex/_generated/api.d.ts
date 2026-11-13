/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_defaults from "../lib/defaults.js";
import type * as lib_time from "../lib/time.js";
import type * as motivation from "../motivation.js";
import type * as notifications from "../notifications.js";
import type * as preferences from "../preferences.js";
import type * as push from "../push.js";
import type * as reminders from "../reminders.js";
import type * as subscriptions from "../subscriptions.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/defaults": typeof lib_defaults;
  "lib/time": typeof lib_time;
  motivation: typeof motivation;
  notifications: typeof notifications;
  preferences: typeof preferences;
  push: typeof push;
  reminders: typeof reminders;
  subscriptions: typeof subscriptions;
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
