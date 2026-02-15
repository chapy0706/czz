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
      {"input":[0],"expected":[0]},
      {"input":[0,0,0],"expected":[0,0,0]},
      {"input":[0,0,0,0,0],"expected":[0,0,0,0,0]},
      {"input":[0,0,0,0,0,0,0,0],"expected":[0,0,0,0,0,0,0,0]},
      {"input":[0,0,0,0,0,0,0,0,0,0],"expected":[0,0,0,0,0,0,0,0,0,0]}
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
      {"input":[7,3,9,1,6,2,8],"expected":[1,2,3,6,7,8,9]},
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
    ),
    (
        '00000000-0000-4000-8000-000000000206',
        'T6: 昇順に並べて 2',
        '数字を小さい順に並べよう',
        '{"commands":[{"type":"SORT_ASC"}]}' :: jsonb,
        '[
      {"input":[3,1],"expected":[1,3]},
      {"input":[5,2,8,1,4],"expected":[1,2,4,5,8]},
      {"input":[7,3,9,1,6,2,8],"expected":[1,2,3,6,7,8,9]},
      {"input":[1,1,1,1],"expected":[1,1,1,1]},
      {"input":[10,1,5,1,10],"expected":[1,1,5,10,10]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-000000000207',
        'T7: 降順に並べて',
        '数字を大きい順に並べよう',
        '{"commands":[{"type":"SORT_DESC"}]}' :: jsonb,
        '[
      {"input":[1,3],"expected":[3,1]},
      {"input":[2,5,1,8,4],"expected":[8,5,4,2,1]},
      {"input":[3,3,3,1,5,5],"expected":[5,5,3,3,3,1]},
      {"input":[],"expected":[]},
      {"input":[0,-1,2,-3],"expected":[2,0,-1,-3]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-000000000208',
        'T8: 合計を出して 2',
        '全ての数字を足し算しよう',
        '{"commands":[{"type":"OUTPUT_SUM"}]}' :: jsonb,
        '[
      {"input":[1],"expected":[1]},
      {"input":[1,2,3,4,5],"expected":[15]},
      {"input":[-5,5],"expected":[0]},
      {"input":[100,200,300],"expected":[600]},
      {"input":[0,0,0,0],"expected":[0]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-000000000209',
        'T9: 先頭を出して',
        '一番前の数字だけ取り出そう',
        '{"commands":[{"type":"OUTPUT_FIRST"}]}' :: jsonb,
        '[
      {"input":[7],"expected":[7]},
      {"input":[3,1,4,1,5],"expected":[3]},
      {"input":[-1,0,1],"expected":[-1]},
      {"input":[],"expected":[]},
      {"input":[99,1,2,3,4,5,6],"expected":[99]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-00000000020a',
        'T10: 末尾を出して',
        '一番後ろの数字だけ取り出そう',
        '{"commands":[{"type":"OUTPUT_LAST"}]}' :: jsonb,
        '[
      {"input":[7],"expected":[7]},
      {"input":[3,1,4,1,5],"expected":[5]},
      {"input":[-1,0,1],"expected":[1]},
      {"input":[],"expected":[]},
      {"input":[1,2,3,4,5,99],"expected":[99]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-00000000020b',
        'T11: 昇順にして末尾を出して',
        '小さい順に並べて一番後ろ（＝最大値）を取り出そう',
        '{"commands":[{"type":"SORT_ASC"},{"type":"OUTPUT_LAST"}]}' :: jsonb,
        '[
      {"input":[3,1],"expected":[3]},
      {"input":[5,2,8,1,4],"expected":[8]},
      {"input":[7,7,7],"expected":[7]},
      {"input":[-3,-1,-2],"expected":[-1]},
      {"input":[0,100,50,100],"expected":[100]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-00000000020c',
        'T12: 降順にして先頭を出して',
        '大きい順に並べて一番前（＝最大値）を取り出そう',
        '{"commands":[{"type":"SORT_DESC"},{"type":"OUTPUT_FIRST"}]}' :: jsonb,
        '[
      {"input":[1,3],"expected":[3]},
      {"input":[2,5,1,8,4],"expected":[8]},
      {"input":[9,9,9],"expected":[9]},
      {"input":[-10,0,10],"expected":[10]},
      {"input":[42],"expected":[42]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-00000000020d',
        'T13: 3より大きいものだけ残して合計',
        '3以下を取り除いてから合計しよう',
        '{"commands":[{"type":"FILTER_GT","value":3},{"type":"OUTPUT_SUM"}]}' :: jsonb,
        '[
      {"input":[1,2,3,4,5],"expected":[9]},
      {"input":[10,20,30],"expected":[60]},
      {"input":[1,2,3],"expected":[0]},
      {"input":[4],"expected":[4]},
      {"input":[0,5,3,7,2,6],"expected":[18]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-00000000020e',
        'T14: 10を足して合計',
        '全部に10を足してから合計しよう',
        '{"commands":[{"type":"MAP_ADD","value":10},{"type":"OUTPUT_SUM"}]}' :: jsonb,
        '[
      {"input":[0],"expected":[10]},
      {"input":[1,2,3],"expected":[36]},
      {"input":[-10,-10],"expected":[0]},
      {"input":[5,5,5,5],"expected":[60]},
      {"input":[0,0,0,0,0],"expected":[50]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-00000000020f',
        'T15: 2倍して合計',
        '全部を2倍にしてから合計しよう',
        '{"commands":[{"type":"MAP_MULTIPLY","value":2},{"type":"OUTPUT_SUM"}]}' :: jsonb,
        '[
      {"input":[1],"expected":[2]},
      {"input":[1,2,3],"expected":[12]},
      {"input":[0,0,0],"expected":[0]},
      {"input":[5,10,15],"expected":[60]},
      {"input":[-1,1,-2,2],"expected":[0]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-000000000210',
        'T16: 3より大きいものに10足して合計',
        '3以下を除いて→10を足して→合計しよう',
        '{"commands":[{"type":"FILTER_GT","value":3},{"type":"MAP_ADD","value":10},{"type":"OUTPUT_SUM"}]}' :: jsonb,
        '[
      {"input":[1,2,3,4,5],"expected":[29]},
      {"input":[10,20],"expected":[50]},
      {"input":[1,2,3],"expected":[0]},
      {"input":[4,5,6],"expected":[45]},
      {"input":[0,4,3,8,1],"expected":[32]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-000000000211',
        'T17: 5より大きいものだけ降順にして先頭',
        '5以下を除いて→大きい順→先頭（＝最大値）',
        '{"commands":[{"type":"FILTER_GT","value":5},{"type":"SORT_DESC"},{"type":"OUTPUT_FIRST"}]}' :: jsonb,
        '[
      {"input":[1,6,3,10,5],"expected":[10]},
      {"input":[6,7,8],"expected":[8]},
      {"input":[100,6],"expected":[100]},
      {"input":[1,2,3,4,5],"expected":[]},
      {"input":[9,6,9,6],"expected":[9]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-000000000212',
        'T18: 2倍して昇順にして末尾',
        '全部2倍→小さい順→末尾（＝最大値）',
        '{"commands":[{"type":"MAP_MULTIPLY","value":2},{"type":"SORT_ASC"},{"type":"OUTPUT_LAST"}]}' :: jsonb,
        '[
      {"input":[3,1,2],"expected":[6]},
      {"input":[5],"expected":[10]},
      {"input":[0,0,0],"expected":[0]},
      {"input":[-1,4,2],"expected":[8]},
      {"input":[10,1,5,3],"expected":[20]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-000000000213',
        'T19: 7を足して昇順にして先頭',
        '全部に7を足して→小さい順→先頭（＝最小値）',
        '{"commands":[{"type":"MAP_ADD","value":7},{"type":"SORT_ASC"},{"type":"OUTPUT_FIRST"}]}' :: jsonb,
        '[
      {"input":[3,1,2],"expected":[8]},
      {"input":[0],"expected":[7]},
      {"input":[-7,0,7],"expected":[0]},
      {"input":[10,10,10],"expected":[17]},
      {"input":[5,1,3,2,4],"expected":[8]}
    ]' :: jsonb,
        1,
        '00000000-0000-4000-8000-000000000104'
    ),
    (
        '00000000-0000-4000-8000-000000000214',
        'T20: 2より大きいものだけ2倍して合計',
        '2以下を除いて→2倍→合計',
        '{"commands":[{"type":"FILTER_GT","value":2},{"type":"MAP_MULTIPLY","value":2},{"type":"OUTPUT_SUM"}]}' :: jsonb,
        '[
      {"input":[1,2,3,4,5],"expected":[24]},
      {"input":[3],"expected":[6]},
      {"input":[1,2],"expected":[0]},
      {"input":[10,20,30],"expected":[120]},
      {"input":[0,3,2,5,1],"expected":[16]}
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