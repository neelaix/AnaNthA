// Temporary local shim. `npx convex dev` regenerates this file with typed
// builders bound to your schema. It is only here so the project can typecheck
// and build before a Convex deployment is connected.
// @ts-nocheck
import {
  actionGeneric,
  httpActionGeneric,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  mutationGeneric,
  queryGeneric,
} from 'convex/server';

export const query = queryGeneric;
export const mutation = mutationGeneric;
export const action = actionGeneric;
export const internalQuery = internalQueryGeneric;
export const internalMutation = internalMutationGeneric;
export const internalAction = internalActionGeneric;
export const httpAction = httpActionGeneric;

export type QueryCtx = any;
export type MutationCtx = any;
export type ActionCtx = any;
