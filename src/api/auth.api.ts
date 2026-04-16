import api from './axios';

export const authApi = {
  googleLogin: (idToken: string) => 
    api.post('/auth/google-login', { idToken }),
  
  linkChildGoogle: (idToken: string) => 
    api.post('/auth/link-child-google', { idToken }),
  
  refresh: (refreshToken: string) => 
    api.post('/auth/refresh', { refreshToken }),
  
  logout: () => 
    api.post('/auth/logout'),
};
