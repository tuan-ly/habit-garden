BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

SELECT public.create_plant_capability_instance(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'reading',
  'Read daily',
  'A gentle reading journey',
  'pages',
  NULL,
  30,
  1,
  '{"startTarget":5,"endTarget":30}'::jsonb
);
COMMIT;
