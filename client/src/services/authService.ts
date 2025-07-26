import apiService from './api';
import { User, UserCreate, LoginCredentials, AuthResponse, ChangePasswordRequest } from '../types/user';

export class AuthService {
  // Connexion
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const url = `${apiService['baseURL']}/token`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Identifiants incorrects');
    }

    const data = await response.json();
    
    // Sauvegarder le token
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  }

  // Inscription
  async register(userData: UserCreate): Promise<{ id: string; username: string; message: string }> {
    return apiService.post('/register', userData);
  }

  // Déconnexion
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Récupérer les informations de l'utilisateur connecté
  async getCurrentUser(): Promise<User> {
    return apiService.get<User>('/users/me');
  }

  // Changer le mot de passe
  async changePassword(request: ChangePasswordRequest): Promise<{ message: string }> {
    return apiService.patch<{ message: string }>('/users/me/password', request);
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  // Récupérer le token
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Récupérer les informations utilisateur du localStorage
  getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Vérifier si le token est expiré
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

export const authService = new AuthService();
export default authService; 