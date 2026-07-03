export type Profile = {
  id: string;
  display_name: string;
  avatar_color: string;
  created_at: string;
};

export type Pod = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type PodMember = {
  pod_id: string;
  user_id: string;
  joined_at: string;
};

export type MealLog = {
  id: string;
  pod_id: string;
  user_id: string;
  name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  photo_url: string | null;
  caption: string | null;
  shared_to_pod: boolean;
  logged_at: string;
};

export type MealLogWithAuthor = MealLog & {
  profiles: Pick<Profile, "id" | "display_name" | "avatar_color"> | null;
};

export type Reaction = {
  meal_log_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};
