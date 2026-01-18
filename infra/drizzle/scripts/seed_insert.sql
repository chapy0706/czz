-- infra/drizzle/scripts/seed_insert.sql
-- NOTE:
-- Zod の z.string().uuid() は RFC4122 の UUID を想定しており、
-- 3rd group 先頭の "version" (1-5) と variant (8/9/a/b) が満たされない UUID は弾かれます。
-- 例: 00000000-0000-0000-0000-... は version=0 なので Invalid UUID になります。
--
-- ここでは「見た目はゼロ多め」でも RFC4122 になるように
-- version=4 (3rd group先頭が 4) / variant=8 (4th group先頭が 8) に揃えています。
BEGIN;

-- users（5件）
INSERT INTO
    users (id, auth_user_id, display_name, role)
VALUES
    (
        '00000000-0000-4000-8000-000000000101',
        NULL,
        'seed-player-1',
        0
    ),
    (
        '00000000-0000-4000-8000-000000000102',
        NULL,
        'seed-player-2',
        0
    ),
    (
        '00000000-0000-4000-8000-000000000103',
        NULL,
        'seed-player-3',
        0
    ),
    (
        '00000000-0000-4000-8000-000000000104',
        NULL,
        'seed-admin-1',
        1
    ),
    (
        '00000000-0000-4000-8000-000000000105',
        NULL,
        'seed-admin-2',
        1
    ) ON CONFLICT (id) DO
UPDATE
SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role;

-- tasks（5件）
INSERT INTO
    tasks (
        id,
        title,
        description,
        dsl_program,
        test_cases,
        is_published,
        created_by_user_id
    )
VALUES
    (
        '00000000-0000-4000-8000-000000000201',
        'T1: ...（何もしないよ）',
        'そのまま出力させてみよう',
        '{"commands":[]}' :: jsonb,
        '[
      {"input":[1,2,3],"expected":[1,2,3]},
      {"input":[],"expected":[]},
      {"input":[5],"expected":[5]},
      {"input":[3,3,2,1],"expected":[3,3,2,1]},
      {"input":[-1,0,1],"expected":[-1,0,1]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-000000000202',
        'T2: 昇順にしてよ',
        '数字を昇順に並べてみよう(例: 3,1,2 → 1,2,3)',
        '{"commands":[{"type":"SORT_ASC"}]}' :: jsonb,
        '[
      {"input":[3,1,2],"expected":[1,2,3]},
      {"input":[],"expected":[]},
      {"input":[1,1,1],"expected":[1,1,1]},
      {"input":[-2,5,0],"expected":[-2,0,5]},
      {"input":[2,1,2,0],"expected":[0,1,2,2]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-000000000203',
        'T3: 2だけが見たい',
        '2だけを残そう(例: 1,2,2,3 → 2,2)',
        '{"commands":[{"type":"FILTER_EQUALS","value":2}]}' :: jsonb,
        '[
      {"input":[1,2,2,3],"expected":[2,2]},
      {"input":[],"expected":[]},
      {"input":[2,2,2],"expected":[2,2,2]},
      {"input":[1,3,4],"expected":[]},
      {"input":[2,1,2,1,2],"expected":[2,2,2]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000105'
    ),
    (
        '00000000-0000-4000-8000-000000000204',
        'T4: 全部に10足してよ',
        '全部の数字に +10しよう(例: 0,1,2 → 10,11,12)',
        '{"commands":[{"type":"MAP_ADD","value":10}]}' :: jsonb,
        '[
      {"input":[0,1,2],"expected":[10,11,12]},
      {"input":[],"expected":[]},
      {"input":[-10,0,10],"expected":[0,10,20]},
      {"input":[5],"expected":[15]},
      {"input":[1,1,1],"expected":[11,11,11]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000105'
    ),
    (
        '00000000-0000-4000-8000-000000000205',
        'T5: 合計が見たい',
        '全ての数字の合計を出そう（例: 1,2,3 → 6）。',
        '{"commands":[{"type":"OUTPUT_SUM"}]}' :: jsonb,
        '[
      {"input":[1,2,3],"expected":[6]},
      {"input":[0],"expected":[0]},
      {"input":[-1,1],"expected":[0]},
      {"input":[10],"expected":[10]},
      {"input":[2,2,2,2],"expected":[8]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ) ON CONFLICT (id) DO
UPDATE
SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    dsl_program = EXCLUDED.dsl_program,
    test_cases = EXCLUDED.test_cases,
    is_published = EXCLUDED.is_published,
    created_by_user_id = EXCLUDED.created_by_user_id;

-- results（5件）
INSERT INTO
    results (
        id,
        user_id,
        task_id,
        submitted_program,
        result_status
    )
VALUES
    (
        '00000000-0000-4000-8000-000000000301',
        '00000000-0000-4000-8000-000000000101',
        '00000000-0000-4000-8000-000000000201',
        '{"commands":[]}' :: jsonb,
        1
    ),
    (
        '00000000-0000-4000-8000-000000000302',
        '00000000-0000-4000-8000-000000000102',
        '00000000-0000-4000-8000-000000000202',
        '{"commands":[{"type":"SORT_ASC"}]}' :: jsonb,
        1
    ),
    (
        '00000000-0000-4000-8000-000000000303',
        '00000000-0000-4000-8000-000000000103',
        '00000000-0000-4000-8000-000000000203',
        '{"commands":[{"type":"FILTER_EQUALS","value":2}]}' :: jsonb,
        1
    ),
    (
        '00000000-0000-4000-8000-000000000304',
        '00000000-0000-4000-8000-000000000101',
        '00000000-0000-4000-8000-000000000204',
        '{"commands":[{"type":"MAP_MULTIPLY","value":10}]}' :: jsonb,
        0
    ),
    (
        '00000000-0000-4000-8000-000000000305',
        '00000000-0000-4000-8000-000000000102',
        '00000000-0000-4000-8000-000000000205',
        '{"commands":[{"type":"OUTPUT_FIRST"}]}' :: jsonb,
        0
    ) ON CONFLICT (id) DO
UPDATE
SET
    user_id = EXCLUDED.user_id,
    task_id = EXCLUDED.task_id,
    submitted_program = EXCLUDED.submitted_program,
    result_status = EXCLUDED.result_status;

COMMIT;