-- infra/drizzle/scripts/seed_insert.sql
-- NOTE:
-- Zod の z.string().uuid() は RFC4122 の UUID を想定しており、
-- 3rd group 先頭の "version" (1-5) と variant (8/9/a/b) が満たされない UUID は弾かれます。
-- ここでは uuid.uuid4() で生成した RFC4122 準拠の UUID v4 を固定値として使用しています。
-- UUID を再生成する場合は scripts/gen_seed_uuids.py を参照してください。
BEGIN;

-- users（5件）
INSERT INTO
    users (id, auth_user_id, display_name, role)
VALUES
    (
        '0be62852-85ae-452e-a488-7defc31fe96b',
        NULL,
        'seed-player-1',
        0
    ),
    (
        'd5f290d9-00dd-4730-a92c-61d5e8d1545a',
        NULL,
        'seed-player-2',
        0
    ),
    (
        '6cd008c0-eafc-4f62-aea9-1a9a2a6187f8',
        NULL,
        'seed-player-3',
        0
    ),
    (
        '2199be54-24c1-403d-bb49-8a5db9a13b24',
        NULL,
        'seed-admin-1',
        1
    ),
    (
        '487db228-8f47-4c12-bd26-fb8dbdda7388',
        NULL,
        'seed-admin-2',
        1
    ) ON CONFLICT (id) DO
UPDATE
SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role;

-- tasks（20件）
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
        'fa58115b-4b3f-458b-900e-425c5e6cdea0',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        'e2055c1a-2667-45e1-b2e4-b95d9552bf42',
        'T2: 昇順にしよう',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        '03b0cdff-dd62-47eb-a216-235dc3b40275',
        'T3: 2だけ表示しよう',
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
        '487db228-8f47-4c12-bd26-fb8dbdda7388'
    ),
    (
        'fc812e3b-ffee-4d49-afb3-79e48f3afe2e',
        'T4: 全部に10を足そう',
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
        '487db228-8f47-4c12-bd26-fb8dbdda7388'
    ),
    (
        '02acbb93-69dc-4682-a314-64994ee7991b',
        'T5: 合計を表示しよう',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        'bf761d18-1c30-4e64-a43f-5de517f58178',
        'T6: 昇順に並べ 2',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        'fe5d90e2-787b-4739-b2e2-34451771e05c',
        'T7: 降順に並べ',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        'ff7242fb-575f-46a3-b30a-ab0cc322e168',
        'T8: 合計を表示 2',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        '25b1123f-f971-43ea-95a5-fba675fee6aa',
        'T9: 先頭のみ表示',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        'eee3780c-47af-4265-a4d3-5bbd2112ae42',
        'T10: 末尾のみ表示',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        '67a3cf5d-3a67-4b3b-935c-b55e6b3827b6',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        '28ade238-c36f-4b06-920d-4e293d803663',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        'a82ae13d-c3c2-426b-a8e3-9568b46dcc9b',
        'T13: 3より大きいものだけの総和',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        'd8127939-29fc-44e0-8977-a7d71b0f90bd',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        '988e2b3a-82ae-4979-b0f6-8ac3aaeb13df',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        '24ae19df-ef94-4d08-8c2b-d14e8df2efd7',
        'T16: 3より大きいものには10を足して合計',
        '3以下を除く→10を足す→合計しよう',
        '{"commands":[{"type":"FILTER_GT","value":3},{"type":"MAP_ADD","value":10},{"type":"OUTPUT_SUM"}]}' :: jsonb,
        '[
        {"input":[1,2,3,4,5],"expected":[29]},
        {"input":[10,20],"expected":[50]},
        {"input":[1,2,3],"expected":[0]},
        {"input":[4,5,6],"expected":[45]},
        {"input":[0,4,3,8,1],"expected":[32]}
    ]' :: jsonb,
        1,
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        '3bf4c485-b098-4a71-8691-88a8cd08c2a0',
        'T17: 5より大きいものだけ降順にして先頭',
        '5以下を除く→大きい順→先頭（＝最大値）',
        '{"commands":[{"type":"FILTER_GT","value":5},{"type":"SORT_DESC"},{"type":"OUTPUT_FIRST"}]}' :: jsonb,
        '[
        {"input":[1,6,3,10,5],"expected":[10]},
        {"input":[6,7,8],"expected":[8]},
        {"input":[100,6],"expected":[100]},
        {"input":[1,2,3,4,5],"expected":[]},
        {"input":[9,6,9,6],"expected":[9]}
    ]' :: jsonb,
        1,
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        '3eb54482-a5cb-41f4-bec1-238ac22d565f',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        '8f6dd886-2919-4384-a505-5b62223300eb',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
    ),
    (
        '08d9a864-8e58-4739-bf13-28d70c80b447',
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
        '2199be54-24c1-403d-bb49-8a5db9a13b24'
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
        'bdec30f6-b11d-40a3-8138-f669e7d2e248',
        '0be62852-85ae-452e-a488-7defc31fe96b',
        'fa58115b-4b3f-458b-900e-425c5e6cdea0',
        '{"commands":[]}' :: jsonb,
        1
    ),
    (
        '25f20c2d-e626-4434-bd42-2fee5e38a0d5',
        'd5f290d9-00dd-4730-a92c-61d5e8d1545a',
        'e2055c1a-2667-45e1-b2e4-b95d9552bf42',
        '{"commands":[{"type":"SORT_ASC"}]}' :: jsonb,
        1
    ),
    (
        '515f5e4d-46df-4733-8215-a469b087ddf9',
        '6cd008c0-eafc-4f62-aea9-1a9a2a6187f8',
        '03b0cdff-dd62-47eb-a216-235dc3b40275',
        '{"commands":[{"type":"FILTER_EQUALS","value":2}]}' :: jsonb,
        1
    ),
    (
        'c7b2c2bc-a2a5-4e2d-8b03-ea1047a0a85c',
        '0be62852-85ae-452e-a488-7defc31fe96b',
        'fc812e3b-ffee-4d49-afb3-79e48f3afe2e',
        '{"commands":[{"type":"MAP_MULTIPLY","value":10}]}' :: jsonb,
        0
    ),
    (
        '718bd02c-f814-4a23-a7e2-78ac13e6b528',
        'd5f290d9-00dd-4730-a92c-61d5e8d1545a',
        '02acbb93-69dc-4682-a314-64994ee7991b',
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
