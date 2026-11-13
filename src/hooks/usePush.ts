import { useCallback, useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import {
  enablePush,
  disablePush,
  getPushSupportState,
  sendTestPush,
  syncExistingPush,
  type PushActionResult,
  type PushSupportState,
} from '../utils/push';

export type PushMessage = {
  type: 'success' | 'error' | 'info';
  text: string;
};

export const usePush = () => {
  const [state, setState] = useState<PushSupportState | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<PushMessage | null>(null);
  const identity = useWorkspaceStore((store) => store.identity);
  const ready = useWorkspaceStore((store) => store.ready);

  const refresh = useCallback(async () => {
    setState(await getPushSupportState());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!ready || !identity) return;
    void syncExistingPush().then(() => refresh());
  }, [ready, identity, refresh]);

  const run = useCallback(
    async (action: () => Promise<PushActionResult>, successType: 'success' | 'info' = 'success') => {
      setBusy(true);
      setMessage(null);
      try {
        const result = await action();
        setMessage({ type: result.ok ? successType : 'error', text: result.message });
        await refresh();
        return result;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const enable = useCallback(() => run(() => enablePush(), 'success'), [run]);
  const disable = useCallback(() => run(() => disablePush(), 'info'), [run]);
  const test = useCallback(() => run(() => sendTestPush(), 'success'), [run]);

  return { state, busy, message, setMessage, enable, disable, test, refresh };
};
