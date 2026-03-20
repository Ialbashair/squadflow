import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const CONNECTOR_ID = "69bd8b784da42b12ff3f7786";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Always use the current user's own Slack token
    const accessToken = await base44.connectors.getCurrentAppUserAccessToken(CONNECTOR_ID);

    const res = await fetch(
      'https://slack.com/api/conversations.list?types=public_channel&exclude_archived=true&limit=200',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();

    if (!data.ok) return Response.json({ error: data.error }, { status: 400 });

    const channels = (data.channels || []).map(ch => ({
      id: ch.id,
      name: ch.name,
      num_members: ch.num_members
    }));

    return Response.json({ channels });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});