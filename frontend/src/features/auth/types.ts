export type UserRole = "participant" | "organizer" | "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
  avatar_url?: string | null;
  plan: string;
}

export type PartialUser = Pick<User, "id" | "role">;

export interface SessionResponse {
  user: User;
  access_token: string;
  expires_in: number;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}
