import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const http = httpRouter();

http.route({
  path: '/push/resubscribe',
  method: 'OPTIONS',
  handler: httpAction(async () => new Response(null, { status: 204, headers: corsHeaders })),
});

http.route({
  path: '/push/resubscribe',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      const body = (await request.json()) as {
        workspaceId?: string;
        deviceId?: string;
        token?: string;
        subscription?: {
          endpoint?: string;
          keys?: { p256dh?: string; auth?: string };
        };
        userAgent?: string;
      };

      const endpoint = body.subscription?.endpoint;
      const p256dh = body.subscription?.keys?.p256dh;
      const auth = body.subscription?.keys?.auth;

      if (!body.workspaceId || !body.deviceId || !body.token || !endpoint || !p256dh || !auth) {
        return new Response(JSON.stringify({ error: 'Missing subscription details' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const result = await ctx.runMutation(api.subscriptions.upsert, {
        workspaceId: body.workspaceId,
        deviceId: body.deviceId,
        token: body.token,
        endpoint,
        p256dh,
        auth,
        userAgent: body.userAgent,
      });

      return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Subscription failed' }),
        { status: 400, headers: corsHeaders },
      );
    }
  }),
});

export default http;
