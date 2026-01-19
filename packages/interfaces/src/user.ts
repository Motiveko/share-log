export interface User {
  id: number;
  email: string;
  nickname?: string;
  avatarUrl?: string;
  slackWebhookUrl?: string;
  isProfileComplete: boolean;
  createdAt: Date;
}

export interface CreateUserDto {
  email: string;
  nickname?: string;
}

export interface PatchUserDto {
  nickname?: string;
  avatarUrl?: string;
  slackWebhookUrl?: string;
}

export interface TokenDto {
  token: string;
}

export interface JwtResponse {
  accessToken: string;
  refreshToken?: string;
}
