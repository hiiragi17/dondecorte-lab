-- ============================================
-- コンテンツ + 出演者(casts) のアトミックな upsert
-- ============================================
-- 各コンテンツ(video / live / radio / article / tv_show / topic)の
-- Server Action は、メインレコードの insert/update と casts の置き換え
-- (delete → insert)を別クエリで実行しており非アトミックだった。
-- 片方が失敗するとデータ不整合(出演者なしレコード / 出演者全消去)が
-- 起こりうるため、両者を 1 つの関数 = 1 トランザクションにまとめる。
--
-- casts は #47 で単一テーブルに統合済みのため、6 コンテンツを
-- 1 つの汎用関数で扱える。

create or replace function upsert_content_with_casts(
  p_content_type text,
  p_content_id   uuid,   -- null の場合は INSERT、指定時は UPDATE
  p_content      jsonb,  -- メインレコードのカラム(キー名 = カラム名)
  p_casts        jsonb   -- [{ "type": "artist|comedy_group|unit", "id": "<uuid>" }, ...]
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
  -- content_type をホワイトリスト検証してテーブル名に解決する
  v_table := case p_content_type
    when 'video'   then 'videos'
    when 'live'    then 'lives'
    when 'radio'   then 'radios'
    when 'article' then 'articles'
    when 'tv_show' then 'tv_shows'
    when 'topic'   then 'topics'
  end;
  if v_table is null then
    raise exception 'content_type が不正です: %', p_content_type;
  end if;

  -- 対象カラム一覧(jsonb のキー = カラム名)
  select string_agg(quote_ident(key), ', ')
    into v_cols
    from jsonb_object_keys(p_content) as key;
  if v_cols is null then
    raise exception 'content が空です';
  end if;

  if p_content_id is null then
    -- INSERT: p_content に含まれるカラムのみ指定し、残りは既定値に任せる
    execute format(
      'insert into %I (%s) select %s from jsonb_populate_record(null::%I, $1) returning id',
      v_table, v_cols, v_cols, v_table
    )
    using p_content
    into v_id;
  else
    -- UPDATE: updated_at は常に現在時刻で更新する
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

  -- casts の置き換え(delete → insert)を同一トランザクション内で実行する
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

comment on function upsert_content_with_casts(text, uuid, jsonb, jsonb) is
  'コンテンツのメインレコード upsert と casts の置き換えを 1 トランザクションで実行する(#64)';

-- 書き込みは認証ユーザーのみ。anon からの実行は禁止する。
revoke execute on function upsert_content_with_casts(text, uuid, jsonb, jsonb) from public;
grant execute on function upsert_content_with_casts(text, uuid, jsonb, jsonb) to authenticated;
