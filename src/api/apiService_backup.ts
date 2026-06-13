import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'https://dev2-mm.srvdev.ru/ppa.webapi.apps';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Методы будут добавлены позже
  async login(email: string, password: string) {
    return { token: 'demo-token' };
  }
}

export const apiService = new ApiService();
