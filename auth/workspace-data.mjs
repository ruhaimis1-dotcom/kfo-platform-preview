export async function loadWorkspace(client) {
  const { data: identity, error: identityError } = await client.auth.getUser();
  if (identityError || !identity?.user) return { kind: 'signed-out' };
  const user = identity.user;
  const { data: memberships, error: memberError } = await client.from('organization_memberships')
    .select('id,user_id,organization_id,status').eq('user_id', user.id);
  if (memberError || !Array.isArray(memberships)
    || memberships.some((m) => m.user_id !== user.id || !m.id || !m.organization_id)) {
    throw new Error('تعذر تحميل عضوياتك. حاول مجددًا.');
  }
  const activeIds = [...new Set(memberships.filter((m) => m.status === 'active').map((m) => m.organization_id))];
  let organizations = [];
  if (activeIds.length) {
    const { data, error } = await client.from('organizations')
      .select('id,display_name,tenant_access_enabled').in('id', activeIds);
    if (error || !Array.isArray(data) || data.some((o) => !activeIds.includes(o.id))) {
      throw new Error('تعذر التحقق من الوصول إلى الشركات. حاول مجددًا.');
    }
    organizations = data;
  }
  return { kind: 'ready', userId: user.id, email: user.email, memberships: memberships.map((m) => {
    const org = organizations.find((o) => o.id === m.organization_id);
    return {
      id: m.id, organizationId: m.organization_id,
      name: org?.display_name || (m.status === 'invited' ? 'دعوة عضوية شركة' : 'عضوية شركة'),
      status: m.status,
      accessible: m.status === 'active' && org?.tenant_access_enabled === true,
    };
  }) };
}
