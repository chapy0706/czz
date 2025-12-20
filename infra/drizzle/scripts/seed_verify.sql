-- seed_verify.sql
select
    'users' as table,
    count(*)
from
    users
union
all
select
    'tasks',
    count(*)
from
    tasks
union
all
select
    'results',
    count(*)
from
    results;