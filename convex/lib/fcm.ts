type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type FcmResult = { ok: boolean; invalid?: boolean; error?: string };

let cachedToken: { value: string; expiresAt: number } | null = null;

function b64url(input: string | Uint8Array): string {
  let text: string;
  if (typeof input === 'string') {
    text = input;
  } else {
    text = '';
    for (const byte of input) text += String.fromCharCode(byte);
  }
  return btoa(text).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function pemToDer(pem: string): Uint8Array {
  const base64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function loadServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured');
  const clean = raw.replace(/^\uFEFF/, '').trim();
  const text = clean.startsWith('{') ? clean : atob(clean);
  const parsed = JSON.parse(text) as ServiceAccount;
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing required fields');
  }
  return parsed;
}

async function signAssertion(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.private_key) as unknown as BufferSource,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  return `${header}.${claims}.${b64url(new Uint8Array(signature))}`;
}

async function accessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.value;

  const assertion = await signAssertion(sa);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });
  const response = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    throw new Error(`FCM auth failed (${response.status}): ${await response.text()}`);
  }
  const json = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: now + (json.expires_in ?? 3600) };
  return json.access_token;
}

export type FcmPayload = {
  title: string;
  body: string;
  data: Record<string, string>;
  channelId?: string;
  sound?: 'default' | 'soft' | 'urgent' | 'silent';
  priority?: 'normal' | 'high';
  category?: string;
  threadId?: string;
};

export async function sendFcm(token: string, payload: FcmPayload): Promise<FcmResult> {
  const sa = loadServiceAccount();
  const bearer = await accessToken(sa);

  const message = {
    token,
    notification: { title: payload.title, body: payload.body },
    data: payload.data,
    android: {
      priority: payload.priority === 'high' ? 'HIGH' : 'NORMAL',
      ttl: '3600s',
      notification: {
        channel_id: payload.channelId ?? 'task_reminders',
        sound: payload.sound === 'silent' ? undefined : 'default',
        default_vibrate_timings: payload.sound !== 'silent',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
    apns: {
      headers: {
        'apns-priority': payload.priority === 'high' ? '10' : '5',
        'apns-push-type': 'alert',
      },
      payload: {
        aps: {
          sound: payload.sound === 'silent' ? undefined : 'default',
          category: payload.category ?? 'ANANTHA_TASK',
          'thread-id': payload.threadId,
          'interruption-level': payload.priority === 'high' ? 'time-sensitive' : 'active',
        },
      },
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    },
  );

  if (response.ok) return { ok: true };

  const text = await response.text();
  const invalid =
    response.status === 404 ||
    /UNREGISTERED|INVALID_ARGUMENT|registration-token-not-registered/i.test(text);
  return { ok: false, invalid, error: text.slice(0, 300) };
}
