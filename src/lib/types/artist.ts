export type Artist = {
  id: string;
  name: string;
  kana_name: string | null;
  profile: string | null;
  debut_year: number | null;
  image_url: string | null;
  x_url: string | null;
  instagram_url: string | null;
  note_url: string | null;
  youtube_channel_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ArtistInput = {
  name: string;
  kana_name: string | null;
  profile: string | null;
  debut_year: number | null;
  image_url: string | null;
  x_url: string | null;
  instagram_url: string | null;
  note_url: string | null;
  youtube_channel_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
};
