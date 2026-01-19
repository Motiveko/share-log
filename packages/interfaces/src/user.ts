export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string;
  createdAt: Date;
}

export interface CreateUserDto {
  email: string;
  displayName: string;
}

export interface PatchUserDto {
  displayName?: string;
  avatarUrl?: string;
}

export interface TokenDto {
  token: string;
}

export interface JwtResponse {
  accessToken: string;
  refreshToken?: string;
}
