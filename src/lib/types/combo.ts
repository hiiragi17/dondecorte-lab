export type ComboGroupType = "combo" | "trio" | "quartet" | "other";

export type Combo = {
  id: string;
  name: string;
  kana_name: string | null;
  group_type: ComboGroupType;
  description: string | null;
  formed_year: number | null;
  image_url: string | null;
  theme_color: string | null;
  x_url: string | null;
  instagram_url: string | null;
  note_url: string | null;
  youtube_channel_url: string | null;
  youtube_channel_id: string | null;
  standfm_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ComboInput = {
  name: string;
  kana_name: string | null;
  group_type: ComboGroupType;
  description: string | null;
  formed_year: number | null;
  image_url: string | null;
  theme_color: string | null;
  x_url: string | null;
  instagram_url: string | null;
  note_url: string | null;
  youtube_channel_url: string | null;
  youtube_channel_id: string | null;
  standfm_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
};

export type ComboMember = {
  id: string;
  comedy_group_id: string;
  artist_id: string;
  role: string | null;
  created_at: string;
};

export type ComboMemberInput = {
  artist_id: string;
  role: string | null;
};

export type ComboMemberWithArtist = ComboMember & {
  artist: {
    id: string;
    name: string;
    kana_name: string | null;
  };
};
