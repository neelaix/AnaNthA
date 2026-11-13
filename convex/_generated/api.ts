// Temporary local shim. `npx convex dev` regenerates this file with typed
// function references for your deployment. It must be replaced before the
// frontend can talk to a real Convex deployment.
// @ts-nocheck
import { anyApi } from 'convex/server';

export const api: any = anyApi;
export const internal: any = anyApi;
