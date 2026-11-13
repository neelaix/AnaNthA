import { ConvexError, v } from 'convex/values';
import type { Doc } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

export const authArgs = {
  workspaceId: v.string(),
  deviceId: v.string(),
  token: v.string(),
};

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export type AuthArgs = {
  workspaceId: string;
  deviceId: string;
  token: string;
};

export async function requireDevice(
  ctx: QueryCtx | MutationCtx,
  args: AuthArgs,
): Promise<Doc<'devices'>> {
  if (!args.workspaceId || !args.deviceId || !args.token) {
    throw new ConvexError('Missing workspace credentials');
  }

  const device = await ctx.db
    .query('devices')
    .withIndex('by_device', (q: any) =>
      q.eq('workspaceId', args.workspaceId).eq('deviceId', args.deviceId),
    )
    .unique();

  if (!device) {
    throw new ConvexError('Device is not registered to this workspace');
  }

  const tokenHash = await hashToken(args.token);
  if (tokenHash !== device.tokenHash) {
    throw new ConvexError('Invalid workspace credentials');
  }

  return device;
}

export function shortId(length = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => alphabet[byte % alphabet.length])
    .join('');
}
