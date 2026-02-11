export const enum UserRole {
  Athlete = "athlete",
  Coach = "coach",
  Admin = "admin",
}

export const enum WorkoutStatus {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
}

export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
}

export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
}

export interface WorkoutDTO {
  id: string;
  title: string;
  status: WorkoutStatus;
}
