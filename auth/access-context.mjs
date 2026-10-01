// Display/navigation context only. Never substitutes for server-side authorization.
export async function loadAccessContext(client) {
  const { data: identity, error: identityError } = await client.auth.getUser();
  if (identityError || !identity?.user) return { kind: 'signed-out' };
  const { data, error } = await client.rpc('my_access_context');
  if (error || !Array.isArray(data)) throw new Error('تعذر التحقق من صلاحياتك. حاول مجددًا.');
  const seen = new Set();
  for (const row of data) {
    if (!row || !row.membership_id || !row.organization_id || seen.has(row.membership_id)
      || !Array.isArray(row.roles) || row.roles.some((role) => !role || typeof role.code !== 'string'
        || !Array.isArray(role.permissions) || role.permissions.some((p) => typeof p !== 'string'))) {
      throw new Error('تعذر التحقق من صلاحياتك. حاول مجددًا.');
    }
    seen.add(row.membership_id);
  }
  // Discard stale data if the authenticated identity changed during the request.
  const { data: current, error: currentError } = await client.auth.getUser();
  if (currentError || current?.user?.id !== identity.user.id) throw new Error('تغيرت الجلسة. أعد تسجيل الدخول.');
  return { kind: 'ready', userId: identity.user.id, memberships: data };
}

export function attachAccessContext(workspace, context) {
  if (context.kind !== 'ready' || workspace.userId !== context.userId) throw new Error('تغيرت الجلسة. أعد تسجيل الدخول.');
  for (const row of context.memberships) {
    if (!workspace.memberships.some((m) => m.id === row.membership_id
      && m.organizationId === row.organization_id && m.accessible)) {
      throw new Error('تغيرت العضوية. أعد التحقق من صلاحياتك.');
    }
  }
  return workspace.memberships.map((m) => ({ ...m,
    roles: context.memberships.find((row) => row.membership_id === m.id)?.roles || [],
  }));
}
