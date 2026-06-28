-- ============================================
-- CM・雑誌の専用コンテンツテーブル追加
-- ============================================
-- これまで CM 情報は topics に、雑誌は articles の source に間借りしていたが、
-- 性質（CM=映像/放送、雑誌=紙媒体/号数）が異なるため独立した content_type として
-- 切り出す。video / live / radio / article / tv_show / topic と同じく
-- casts（ポリモーフィック出演者）・memos・upsert_content_with_casts の対象に加える。
--
-- 参考:
--   - casts 統合: supabase/migrations/005_unified_casts.sql
--   - 汎用 upsert: supabase/migrations/006_upsert_content_with_casts.sql
--   - 明示 GRANT 運用: supabase/migrations/008_explicit_grants.sql

-- ============================================
-- 1. CM
-- ============================================
create table cms (
  id uuid primary key default gen_random_uuid(),
  title text not null,        -- CM・案件のタイトル
  advertiser text,            -- 企業・ブランド名
  product text,               -- 商品・サービス名
  url text,                   -- CM動画・紹介ページ等のURL
  aired_on date,              -- 放送・公開日（ソート用の主たる日付）
  description text,           -- 内容メモ（Markdown対応）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table cms is 'CM・広告案件';

-- ============================================
-- 2. 雑誌
-- ============================================
create table magazines (
  id uuid primary key default gen_random_uuid(),
  title text not null,        -- 掲載内容・特集のタイトル
  magazine_name text,         -- 誌名
  issue text,                 -- 号数（例: 2026年7月号）
  publisher text,             -- 出版社
  url text,                   -- 販売・紹介ページのURL
  published_on date,          -- 発売日（ソート用の主たる日付）
  description text,           -- 内容メモ（Markdown対応）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table magazines is '雑誌掲載';

-- ============================================
-- 3. インデックス（日付ソート用）
-- ============================================
create index idx_cms_aired_on on cms(aired_on desc);
create index idx_magazines_published_on on magazines(published_on desc);

-- ============================================
-- 4. updated_at 自動更新トリガー
-- ============================================
-- update_updated_at() は migration 001 で定義済み。
create trigger trg_cms_updated before update on cms
  for each row execute function update_updated_at();
create trigger trg_magazines_updated before update on magazines
  for each row execute function update_updated_at();

-- ============================================
-- 5. casts の content_type を cm / magazine に拡張
-- ============================================
alter table casts drop constraint casts_content_type_check;
alter table casts add constraint casts_content_type_check
  check (content_type in (
    'video', 'live', 'radio', 'article', 'tv_show', 'topic', 'cm', 'magazine'
  ));

-- 親コンテンツ削除時に対応する casts 行を掃除する（005 の関数を再利用）。
create trigger trg_cms_delete_casts before delete on cms
  for each row execute function delete_casts_on_content_delete('cm');
create trigger trg_magazines_delete_casts before delete on magazines
  for each row execute function delete_casts_on_content_delete('magazine');

-- casts の親存在チェック関数に cm / magazine を追加する（005 の validate_cast_content）。
create or replace function validate_cast_content()
returns trigger
language plpgsql
as $$
declare
  content_exists boolean;
begin
  case new.content_type
    when 'video' then
      select exists(select 1 from videos where id = new.content_id) into content_exists;
    when 'live' then
      select exists(select 1 from lives where id = new.content_id) into content_exists;
    when 'radio' then
      select exists(select 1 from radios where id = new.content_id) into content_exists;
    when 'article' then
      select exists(select 1 from articles where id = new.content_id) into content_exists;
    when 'tv_show' then
      select exists(select 1 from tv_shows where id = new.content_id) into content_exists;
    when 'topic' then
      select exists(select 1 from topics where id = new.content_id) into content_exists;
    when 'cm' then
      select exists(select 1 from cms where id = new.content_id) into content_exists;
    when 'magazine' then
      select exists(select 1 from magazines where id = new.content_id) into content_exists;
    else
      raise exception 'casts.content_type が不正です: %', new.content_type;
  end case;

  if not content_exists then
    raise exception 'casts.content_id (%) が % テーブルに存在しません',
      new.content_id, new.content_type;
  end if;

  return new;
end;
$$;

-- ============================================
-- 6. memos の target_type を cm / magazine に拡張
-- ============================================
alter table memos drop constraint memos_target_type_check;
alter table memos add constraint memos_target_type_check
  check (target_type in (
    'video', 'live', 'radio', 'article', 'tv_show', 'topic', 'cm', 'magazine'
  ));

-- ============================================
-- 7. upsert_content_with_casts の content_type→テーブル解決に cm / magazine を追加
-- ============================================
create or replace function upsert_content_with_casts(
  p_content_type text,
  p_content_id   uuid,
  p_content      jsonb,
  p_casts        jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_table text;
  v_id    uuid;
  v_cols  text;
  v_set   text;
  v_count int;
begin
  v_table := case p_content_type
    when 'video'    then 'videos'
    when 'live'     then 'lives'
    when 'radio'    then 'radios'
    when 'article'  then 'articles'
    when 'tv_show'  then 'tv_shows'
    when 'topic'    then 'topics'
    when 'cm'       then 'cms'
    when 'magazine' then 'magazines'
  end;
  if v_table is null then
    raise exception 'content_type が不正です: %', p_content_type;
  end if;

  select string_agg(quote_ident(key), ', ')
    into v_cols
    from jsonb_object_keys(p_content) as key;
  if v_cols is null then
    raise exception 'content が空です';
  end if;

  if p_content_id is null then
    execute format(
      'insert into %I (%s) select %s from jsonb_populate_record(null::%I, $1) returning id',
      v_table, v_cols, v_cols, v_table
    )
    using p_content
    into v_id;
  else
    v_id := p_content_id;
    select string_agg(format('%I = r.%I', key, key), ', ')
      into v_set
      from jsonb_object_keys(p_content) as key;
    execute format(
      'update %I as t set %s, updated_at = now() '
      'from jsonb_populate_record(null::%I, $1) as r where t.id = $2',
      v_table, v_set, v_table
    )
    using p_content, v_id;

    get diagnostics v_count = row_count;
    if v_count <> 1 then
      raise exception '指定されたコンテンツが見つかりません'
        using errcode = 'no_data_found';
    end if;
  end if;

  delete from casts
   where content_type = p_content_type
     and content_id = v_id;

  insert into casts (content_type, content_id, artist_id, comedy_group_id, unit_id)
  select
    p_content_type,
    v_id,
    case when c->>'type' = 'artist'       then (c->>'id')::uuid end,
    case when c->>'type' = 'comedy_group' then (c->>'id')::uuid end,
    case when c->>'type' = 'unit'         then (c->>'id')::uuid end
  from jsonb_array_elements(coalesce(p_casts, '[]'::jsonb)) as c;

  return v_id;
end;
$$;

-- ============================================
-- 8. RLS（読み取りは公開、書き込みは認証ユーザーのみ）
-- ============================================
alter table cms enable row level security;
alter table magazines enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['cms', 'magazines'])
  loop
    execute format(
      'create policy %I on %I for select to anon, authenticated using (true)',
      t || '_select', t
    );
    execute format(
      'create policy %I on %I for insert to authenticated with check (true)',
      t || '_insert', t
    );
    execute format(
      'create policy %I on %I for update to authenticated using (true) with check (true)',
      t || '_update', t
    );
    execute format(
      'create policy %I on %I for delete to authenticated using (true)',
      t || '_delete', t
    );
  end loop;
end $$;

-- ============================================
-- 9. 明示的な GRANT（008 でデフォルト権限を revoke しているため必須）
-- ============================================
-- 公開読み取り対象: anon は SELECT のみ、authenticated / service_role は CRUD。
-- 主キーは uuid のため sequence 権限は不要。
do $$
declare
  t text;
begin
  for t in select unnest(array['cms', 'magazines'])
  loop
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;
