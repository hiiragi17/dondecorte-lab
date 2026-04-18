export type Unit = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type UnitInput = {
  name: string;
  description: string | null;
};

export type UnitMember = {
  id: string;
  unit_id: string;
  created_at: string;
} & (
  | { comedy_group_id: string; artist_id: null }
  | { comedy_group_id: null; artist_id: string }
);

export type UnitMemberEntry = {
  type: "comedy_group" | "artist";
  id: string;
  name: string;
  kana_name: string | null;
};
