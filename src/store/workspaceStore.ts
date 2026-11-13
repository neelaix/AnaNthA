import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../../convex/_generated/api';
import { convex, convexEnabled } from '../lib/convex';
import { randomToken, sha256Hex } from '../utils/crypto';
import { savePushIdentity, type StoredIdentity } from '../utils/idb';

export type { StoredIdentity as WorkspaceIdentity };

function detectDeviceName(): string {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Browser';
  const platform = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad|iPod/.test(ua)
      ? 'iOS'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS/.test(ua)
          ? 'Mac'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Device';
  return `${platform} · ${browser}`;
}

async function buildIdentity(): Promise<{
  deviceId: string;
  token: string;
  tokenHash: string;
  deviceName: string;
}> {
  const deviceId = crypto.randomUUID();
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  return { deviceId, token, tokenHash, deviceName: detectDeviceName() };
}

interface WorkspaceState {
  identity: StoredIdentity | null;
  ready: boolean;
  error?: string;
  pairCode?: string;
  pairCodeExpiresAt?: number;
  ensure: () => Promise<void>;
  join: (pairCode: string) => Promise<{ ok: boolean; message?: string }>;
  refreshPairCode: () => Promise<{ ok: boolean; message?: string }>;
  clearLocalIdentity: () => void;
}

let ensurePromise: Promise<void> | null = null;

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      identity: null,
      ready: false,

      ensure: async () => {
        if (ensurePromise) return ensurePromise;
        ensurePromise = (async () => {
          if (!convexEnabled || !convex) {
            set({ ready: true, error: undefined });
            return;
          }

          const current = get().identity;
          if (current) {
            try {
              const valid = await convex.query(api.workspaces.validate, {
                workspaceId: current.workspaceId,
                deviceId: current.deviceId,
                token: current.token,
              });
              if (valid) {
                await savePushIdentity(current);
                set({ ready: true, error: undefined });
                return;
              }
            } catch {
              // Fall through and create a fresh workspace.
            }
          }

          try {
            const { deviceId, token, tokenHash, deviceName } = await buildIdentity();
            const result = await convex.mutation(api.workspaces.create, {
              deviceId,
              deviceName,
              tokenHash,
              userAgent: navigator.userAgent,
            });
            const identity: StoredIdentity = {
              workspaceId: result.workspaceId,
              deviceId,
              token,
              deviceName,
            };
            await savePushIdentity(identity);
            set({
              identity,
              ready: true,
              pairCode: result.pairCode,
              pairCodeExpiresAt: result.pairCodeExpiresAt,
              error: undefined,
            });
          } catch (error) {
            set({
              ready: true,
              error: error instanceof Error ? error.message : 'Could not connect to the notification backend',
            });
          }
        })().finally(() => {
          ensurePromise = null;
        });
        return ensurePromise;
      },

      join: async (pairCode) => {
        if (!convexEnabled || !convex) {
          return { ok: false, message: 'Notification backend is not configured.' };
        }
        const code = pairCode.trim().toUpperCase();
        if (code.length < 6) return { ok: false, message: 'Enter the pairing code from your other device.' };
        try {
          const { deviceId, token, tokenHash, deviceName } = await buildIdentity();
          const result = await convex.mutation(api.workspaces.join, {
            pairCode: code,
            deviceId,
            deviceName,
            tokenHash,
            userAgent: navigator.userAgent,
          });
          const identity: StoredIdentity = {
            workspaceId: result.workspaceId,
            deviceId,
            token,
            deviceName,
          };
          await savePushIdentity(identity);
          set({ identity, ready: true, pairCode: undefined, pairCodeExpiresAt: undefined, error: undefined });
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : 'Could not join this workspace.',
          };
        }
      },

      refreshPairCode: async () => {
        if (!convexEnabled || !convex) {
          return { ok: false, message: 'Notification backend is not configured.' };
        }
        const identity = get().identity;
        if (!identity) return { ok: false, message: 'Workspace is not ready yet.' };
        try {
          const result = await convex.mutation(api.workspaces.refreshPairCode, {
            workspaceId: identity.workspaceId,
            deviceId: identity.deviceId,
            token: identity.token,
          });
          set({ pairCode: result.pairCode, pairCodeExpiresAt: result.pairCodeExpiresAt });
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : 'Could not create a pairing code.',
          };
        }
      },

      clearLocalIdentity: () => {
        void savePushIdentity(null);
        set({ identity: null, pairCode: undefined, pairCodeExpiresAt: undefined });
      },
    }),
    {
      name: 'anantha-workspace-v1',
      partialize: (state) => ({ identity: state.identity }),
    },
  ),
);
