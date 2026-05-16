-- infra/drizzle/scripts/seed_cleanup.sql
-- NOTE: seed_insert.sql と UUID を必ず一致させること。
BEGIN;

-- 1) seed tasks を参照している results を全部消す
DELETE FROM
    results
WHERE
    id IN (
        'bdec30f6-b11d-40a3-8138-f669e7d2e248',
        '25f20c2d-e626-4434-bd42-2fee5e38a0d5',
        '515f5e4d-46df-4733-8215-a469b087ddf9',
        'c7b2c2bc-a2a5-4e2d-8b03-ea1047a0a85c',
        '718bd02c-f814-4a23-a7e2-78ac13e6b528'
    );

-- 2) seed tasks を消す（全20件）
DELETE FROM
    tasks
WHERE
    id IN (
        'fa58115b-4b3f-458b-900e-425c5e6cdea0',
        'e2055c1a-2667-45e1-b2e4-b95d9552bf42',
        '03b0cdff-dd62-47eb-a216-235dc3b40275',
        'fc812e3b-ffee-4d49-afb3-79e48f3afe2e',
        '02acbb93-69dc-4682-a314-64994ee7991b',
        'bf761d18-1c30-4e64-a43f-5de517f58178',
        'fe5d90e2-787b-4739-b2e2-34451771e05c',
        'ff7242fb-575f-46a3-b30a-ab0cc322e168',
        '25b1123f-f971-43ea-95a5-fba675fee6aa',
        'eee3780c-47af-4265-a4d3-5bbd2112ae42',
        '67a3cf5d-3a67-4b3b-935c-b55e6b3827b6',
        '28ade238-c36f-4b06-920d-4e293d803663',
        'a82ae13d-c3c2-426b-a8e3-9568b46dcc9b',
        'd8127939-29fc-44e0-8977-a7d71b0f90bd',
        '988e2b3a-82ae-4979-b0f6-8ac3aaeb13df',
        '24ae19df-ef94-4d08-8c2b-d14e8df2efd7',
        '3bf4c485-b098-4a71-8691-88a8cd08c2a0',
        '3eb54482-a5cb-41f4-bec1-238ac22d565f',
        '8f6dd886-2919-4384-a505-5b62223300eb',
        '08d9a864-8e58-4739-bf13-28d70c80b447'
    );

-- 3) seed users を消す（seed tasks が消えた後ならOK）
DELETE FROM
    users
WHERE
    id IN (
        '0be62852-85ae-452e-a488-7defc31fe96b',
        'd5f290d9-00dd-4730-a92c-61d5e8d1545a',
        '6cd008c0-eafc-4f62-aea9-1a9a2a6187f8',
        '2199be54-24c1-403d-bb49-8a5db9a13b24',
        '487db228-8f47-4c12-bd26-fb8dbdda7388'
    );

COMMIT;
