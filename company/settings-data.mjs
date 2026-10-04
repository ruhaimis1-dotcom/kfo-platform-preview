import { loadWorkspace } from '../auth/workspace-data.mjs';
import { loadAccessContext, attachAccessContext } from '../auth/access-context.mjs';

export function canManageSettings(membership) {
  return membership?.accessible === true && membership.roles.some(role =>
    !role.branch_id && !role.department_id && role.permissions.includes('organization.settings.manage'));
}

export async function loadCompanySettings(client, organizationId, expectedUserId) {
  const workspace = await loadWorkspace(client);
  if (workspace.kind === 'signed-out') return workspace;
  if (expectedUserId && workspace.userId !== expectedUserId) throw new Error('session-changed');
  const context = await loadAccessContext(client);
  const membership = attachAccessContext(workspace, context).find(m => m.organizationId === organizationId);
  if (!canManageSettings(membership)) return { kind: 'forbidden' };
  return { kind: 'ready', userId: workspace.userId, membership };
}

export async function saveCompanyName(client, organizationId, userId, input) {
  const name = input.trim();
  if ([...name].length < 2 || [...name].length > 120 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error('invalid-name');
  const current = await loadCompanySettings(client, organizationId, userId);
  if (current.kind !== 'ready') throw new Error('forbidden');
  const { data, error } = await client.rpc('update_company_display_name', {
    p_organization_id: organizationId, p_display_name: name,
  });
  if (error || data !== name) throw new Error('save-failed');
  const verified = await loadCompanySettings(client, organizationId, userId);
  if (verified.kind !== 'ready' || verified.membership.name !== name) throw new Error('verification-failed');
  return verified;
}
