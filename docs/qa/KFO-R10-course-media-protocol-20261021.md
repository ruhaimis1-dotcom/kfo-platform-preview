# Course media client foundation — not activated

Implemented admin/course-media.mjs, deliberately NOT imported by live editor. Tested using mocked clients, with no storage uploads/database changes/provider deployment.

The client supports: explicit course/version scoping; cover fit and vertical focal position; required cover/image alt text; ordered text/image/MP4/MP3/OGG/WAV references; immutable reordering; basic client file-header/MIME/size checks; reserved upload path (no upsert); identity and current-course checks before/after upload; ready asset confirmation; optimistic media revision and returned-data equality checks; exact-project/path signed URLs.

Proposed RPC contract (server implementation still required):
- admin_reserve_course_media(p_slug,p_version,p_kind,p_mime_type,p_size_bytes) returns asset_id, object_path, course_slug, course_version, bucket. Require verified auth.uid and platform-admin authority in database. Path exactly slug/version/asset UUID; fixed private bucket kfo-course-media; expiry and per-admin reservations required.
- admin_confirm_course_media(p_asset_id) returns a scoped ready asset only AFTER trusted server inspection confirms file contents/type/size/decodability. Storage metadata alone and browser signature checks are not trusted validation. Refuse missing, expired, unscanned or foreign reservations. No mutation solely by supplying object paths.
- admin_course_media_draft(p_slug,p_version) returns scope, revision, draft, ready assets. Admin only.
- admin_save_course_media(p_slug,p_version,p_expected_revision,p_draft) validates exact draft shape, activity keys/types, ready asset ownership and locked revision; increment exactly once; record audit; return verified full draft. Server enforces same size limits regardless of browser.

Draft schemaVersion 1: cover=null or {assetId,alt,fit,positionY}; activities maps existing content activity keys to up to 30 blocks each, 120 total. Blocks: {id,type:text,text} or {id,type:image|video|audio,assetId,title,alt,transcript}. Reject URL, HTML, arbitrary iframe fields; unknown/deleted activity refs and duplicate block IDs rejected. Asset records scoped to a single course/version. Media has independent revision; course release fingerprint MUST include media revision and immutable references to prevent stale snapshots.

Access/lifecycle required before activation: admin scoped reserve/upload/read with no anonymous bucket access; no UPDATE/upsert; no delete of referenced assets; reservation expiry/unreferenced cleanup; quarantine/ready distinction; learner read capability tied to verified enrolled/published access, course/version and organization context; renewal of short-lived signed URLs; no private keys in browser. Public course covers require a separate approved public projection; do not make lesson media public. No learner access RLS or bucket created by this change.

No invented video duration or automatic completion: runtime completion/assessment policy remains separate. Playback failures/expired URLs need real browser integration tests. Current public build, DB and SCCC unchanged. Full media functionality is not ready: server gates, storage scanning, schema/release migration and browser UI/player integration remain outstanding. Limits 5 MiB image/50 MiB audio-video here are conservative client-foundation limits, not approved production capacity.

Reference reviewed: official Supabase Storage Access Control documentation. Changelog markdown fetch failed with unsupported content-type; no version-sensitive feature/API or SDK version change introduced. Existing SDK methods upload/createSignedUrl reused. Supabase storage objects RLS policies required; upsert not used.
