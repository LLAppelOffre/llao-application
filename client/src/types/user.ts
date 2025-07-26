export interface User {
  id?: string;
  username: string;
  full_name?: string;
  role: string;
  disabled?: boolean;
  date_creation?: string;
}

export interface UserCreate {
  username: string;
  password: string;
  full_name?: string;
  role?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    username: string;
    full_name?: string;
    role: string;
  };
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
} 