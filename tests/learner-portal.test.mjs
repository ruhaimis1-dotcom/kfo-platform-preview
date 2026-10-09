import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLearnerPortal } from '../auth/learner-data.mjs';

function clientFor(payload, userId='u1') {
  return {
    auth: { getUser: async () => ({ data: { user: { id: userId } }, error: null }) },
    rpc: async (name) => {
      assert.equal(name, 'my_learner_portal');
      return { data: payload, error: null };
    },
  };
}
const own = {
  memberships: [{ membership_id:'m1', organization_id:'o1', organization_name:'Hirely', branch_id:null, department_id:null, status:'active' }],
  assignments: [{ id:'a1', membership_id:'m1', organization_id:'o1', course_slug:'work-priorities', course_version:1, status:'assigned' }],
};
test('learner portal accepts assignments only inside active memberships', async () => {
  const result = await loadLearnerPortal(clientFor(own), 'u1');
  assert.equal(result.kind, 'ready');
  assert.equal(result.assignments.length, 1);
});
test('learner portal rejects foreign membership or organization assignments', async () => {
  for (const change of [
    { membership_id:'foreign' }, { organization_id:'foreign' }, { status:'cancelled' },
  ]) {
    const payload = structuredClone(own); Object.assign(payload.assignments[0], change);
    await assert.rejects(loadLearnerPortal(clientFor(payload), 'u1'));
  }
});
test('learner portal rejects inactive or malformed membership context', async () => {
  for (const mutate of [
    p => { p.memberships[0].status='inactive'; },
    p => { delete p.memberships[0].organization_id; },
    p => { p.memberships = null; },
  ]) {
    const payload=structuredClone(own); mutate(payload);
    await assert.rejects(loadLearnerPortal(clientFor(payload), 'u1'));
  }
});
test('learner portal stops if authenticated identity changes', async () => {
  await assert.rejects(loadLearnerPortal(clientFor(own, 'u2'), 'u1'));
});
