export async function loadLearnerPortal(client, expectedUserId) {
  const { data: identity, error: identityError } = await client.auth.getUser();
  if (identityError || !identity?.user) return { kind: 'signed-out' };
  if (identity.user.id !== expectedUserId) throw new Error('تغيرت هوية الجلسة.');
  const { data, error } = await client.rpc('my_learner_portal');
  if (error || !data || !Array.isArray(data.memberships) || !Array.isArray(data.assignments)) {
    throw new Error('تعذر تحميل بوابة التعلم.');
  }
  const membershipIds = new Set(data.memberships.map((m) => m.membership_id));
  const organizationIds = new Set(data.memberships.map((m) => m.organization_id));
  if (data.memberships.some((m) => !m.membership_id || !m.organization_id || m.status !== 'active')
    || data.assignments.some((a) => !membershipIds.has(a.membership_id)
      || !organizationIds.has(a.organization_id) || a.status === 'cancelled')) {
    throw new Error('وصلت بيانات تعلم خارج نطاق العضوية.');
  }
  return { kind: 'ready', memberships: data.memberships, assignments: data.assignments };
}
