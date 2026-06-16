import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = 'https://dev2-mm.srvdev.ru/ppa.webapi.apps';
const AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || '/passenger.auth';
const PASSENGER_API_BASE_URL = import.meta.env.VITE_PASSENGER_API_URL || '/passenger/api';
const MAAS_API_BASE_URL = import.meta.env.VITE_MAAS_API_URL || '/maas';
const TICKET_CATALOG_API_BASE_URL = import.meta.env.VITE_TICKET_CATALOG_API_URL || '/ticket-catalog';
const AUTH_BASIC_TOKEN = 'Basic ZjljM2M4NTktOTc3YS00ZWI3LTliY2UtNDM2OTk2NGRmODU1OlJkb3pEZjkzakxLcDI2MzVFcG1KVUwzbWM2bzFVSw==';
const OTP_SCOPE = 'openid nbs.ppa phone email idps';

export type OtpStartResponse = {
  key: string;
  password_parameters?: {
    attempt_count?: number;
    expires_in?: number;
    length?: number;
  };
  retries_in?: number;
  user_registered?: boolean;
};

export type OtpTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
  scope?: string;
};

export type DashboardBootstrapResponse = {
  accountInfo: unknown | null;
  carriers: unknown | null;
  sbpSubscription: unknown | null;
  maasUser: unknown | null;
  trips: unknown | null;
  operations: unknown | null;
  failures: Array<{
    key: keyof Omit<DashboardBootstrapResponse, 'failures'>;
    message: string;
    status?: number;
  }>;
};

export type CardSearchItem = {
  number?: string;
  uid?: string;
  typeId?: string;
  typeName?: string;
  cmsName?: string;
  cmsTitle?: string;
  limited?: boolean;
  icon?: string;
  img?: string;
};

export type CardSearchResponse = {
  cards?: CardSearchItem[];
};

export type WalletProduct = {
  id?: string;
  name?: string;
  priceMin?: number;
  priceMax?: number;
  paymentTypes?: string[];
};

export type TicketProduct = {
  productId?: string;
  id?: string;
  durationDays?: number | null;
  name?: string;
  descr?: string;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  pricePerDay?: number | null;
  paymentTypes?: string[];
  typeName?: string;
  options?: TicketProductOption[];
  isFreezable?: boolean;
  isRecommended?: boolean;
  optionName?: string;
  optionDescr?: string;
  deltaPrice?: number;
  priceDelta?: number;
};

export type TicketProductSection = {
  iconType?: string;
  title?: string;
  subtitle?: string | null;
  products?: TicketProduct[];
};

export type TicketProductOption = {
  id?: string;
  name?: string;
  descr?: string;
  price?: number;
  priceDelta?: number;
  deltaPrice?: number;
  isDefault?: boolean;
  isRecommended?: boolean;
  isFreezable?: boolean;
};

export type BankCardItem = {
  cardType?: string;
  displayName?: string;
  externalLinkedBankCardId?: string;
  id?: string;
  linkedBankCardId?: string;
  maskedPan?: string;
  number?: string;
  pan?: string;
  type?: string;
};

export type TicketProductCategory = {
  iconType?: string;
  productIconType?: string;
  title?: string;
  subtitle?: string | null;
  sections?: TicketProductSection[];
};

export type TicketProductsResponse = {
  card?: {
    cardUid?: string;
    linkedCardId?: string;
    cardType?: string;
    cardNumberMasked?: string;
  };
  availableProducts?: {
    wallet?: WalletProduct | null;
    categories?: TicketProductCategory[];
  };
  icons?: {
    categories?: Record<string, string[]>;
    sections?: Record<string, string[]>;
    products?: Record<string, string[]>;
  };
};

export type PaymentValidationResponse = {
  data?: {
    card?: {
      cardNumber?: string;
      displayName?: string;
      limited?: boolean;
      cardType?: string;
      icon?: string;
      img?: string;
    };
    availableProducts?: TicketProduct[];
    availableWallet?: WalletProduct;
  };
  success?: boolean;
};

class ApiService {
  private readonly api: AxiosInstance;
  private readonly authApi: AxiosInstance;
  private readonly passengerApi: AxiosInstance;
  private readonly maasApi: AxiosInstance;
  private readonly ticketCatalogApi: AxiosInstance;
  private dashboardBootstrapRequest: Promise<DashboardBootstrapResponse> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.authApi = axios.create({
      baseURL: AUTH_API_BASE_URL,
    });

    this.passengerApi = axios.create({
      baseURL: PASSENGER_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.maasApi = axios.create({
      baseURL: MAAS_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.ticketCatalogApi = axios.create({
      baseURL: TICKET_CATALOG_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config: InternalAxiosRequestConfig) => this.withBearerToken(config));
    this.passengerApi.interceptors.request.use((config: InternalAxiosRequestConfig) => this.withBearerToken(config));
    this.maasApi.interceptors.request.use((config: InternalAxiosRequestConfig) => this.withBearerToken(config));
    this.ticketCatalogApi.interceptors.request.use((config: InternalAxiosRequestConfig) => this.withBearerToken(config));

    const handleUnauthorized = (error: AxiosError) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authExpiresAt');
        window.location.href = '/';
      }
      return Promise.reject(error);
    };

    this.api.interceptors.response.use((response: AxiosResponse) => response, handleUnauthorized);
    this.passengerApi.interceptors.response.use((response: AxiosResponse) => response, handleUnauthorized);
    this.maasApi.interceptors.response.use((response: AxiosResponse) => response, handleUnauthorized);
    this.ticketCatalogApi.interceptors.response.use((response: AxiosResponse) => response);
  }

  private withBearerToken(config: InternalAxiosRequestConfig) {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
  }

  async login(username: string, password: string): Promise<OtpTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'password',
      password,
      scope: OTP_SCOPE,
      username,
    });

    const response = await this.authApi.post<OtpTokenResponse>('/connect/token', body, {
      headers: this.getOtpHeaders(),
    });

    return response.data;
  }

  async requestOtpCode(username: string): Promise<OtpStartResponse> {
    const body = new URLSearchParams({
      scope: OTP_SCOPE,
      username,
    });

    const response = await this.authApi.post<OtpStartResponse>('/connect/otp', body, {
      headers: this.getOtpHeaders(),
    });

    return response.data;
  }

  async confirmOtpCode(key: string, password: string): Promise<OtpTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'otp',
      key,
      password,
    });

    const response = await this.authApi.post<OtpTokenResponse>('/connect/token', body, {
      headers: this.getOtpHeaders(),
    });

    return response.data;
  }

  async getAccountInfo(): Promise<unknown> {
    const response = await this.passengerApi.get<unknown>('/accounts/v1.0/info');
    return response.data;
  }

  async getLinkedCarriers(): Promise<unknown> {
    const response = await this.passengerApi.get<unknown>('/carriers/v1.0/linked');
    return response.data;
  }

  async getSbpSubscriptionState(): Promise<unknown> {
    const response = await this.passengerApi.get<unknown>('/sbp/v1.0/subscription/state');
    return response.data;
  }

  async getBankCards(): Promise<unknown> {
    const response = await this.passengerApi.get<unknown>('/bankCards/v1.0');
    return response.data;
  }

  async getTrips(size = 4): Promise<unknown> {
    const response = await this.passengerApi.get<unknown>('/trips/v1.0', {
      params: {
        Size: size,
      },
    });
    return response.data;
  }

  async getOperations(size = 4): Promise<unknown> {
    const response = await this.passengerApi.post<unknown>(
      '/operations/v1.0',
      {},
      {
        params: {
          size,
        },
      },
    );
    return response.data;
  }

  async getMaasUserInfo(): Promise<unknown> {
    const response = await this.maasApi.get<unknown>('/api/user/v2/info');
    return response.data;
  }

  async searchCardsByNumber(cardNumber: string): Promise<CardSearchResponse> {
    const response = await this.passengerApi.get<CardSearchResponse>('/cards/v1.0', {
      params: {
        cardNumber,
      },
    });

    return response.data;
  }

  async getTicketProductsByCardUid(cardUid: string): Promise<TicketProductsResponse> {
    const response = await this.ticketCatalogApi.get<TicketProductsResponse>(`/tickets/cards/by-uid/${encodeURIComponent(cardUid)}/products`, {
      params: {
        language: 'ru',
      },
    });
    return response.data;
  }

  async getTicketProductsByLinkedCardId(linkedCardId: string): Promise<TicketProductsResponse> {
    const response = await this.ticketCatalogApi.get<TicketProductsResponse>(`/tickets/cards/${encodeURIComponent(linkedCardId)}/products`, {
      params: {
        language: 'ru',
      },
    });
    return response.data;
  }

  async validateCardPaymentProducts(cardUid: string): Promise<PaymentValidationResponse> {
    const response = await this.passengerApi.get<PaymentValidationResponse>(`/cards/v1.0/${encodeURIComponent(cardUid)}/validate/payment`);
    return response.data;
  }

  async registerCurrentDevice(): Promise<unknown> {
    const response = await this.passengerApi.post<unknown>('/devices/v1.0', {
      device: {
        displayName: 'Web browser',
        id: this.getDeviceId(),
        model: navigator.userAgent,
        os: 'web',
        osVer: navigator.platform || 'unknown',
        type: 'web',
      },
      pushToken: null,
      pushTokens: null,
    });

    return response.data;
  }

  async getDashboardBootstrap(): Promise<DashboardBootstrapResponse> {
    if (this.dashboardBootstrapRequest) {
      return this.dashboardBootstrapRequest;
    }

    this.dashboardBootstrapRequest = this.fetchDashboardBootstrap().finally(() => {
      this.dashboardBootstrapRequest = null;
    });

    return this.dashboardBootstrapRequest;
  }

  private async fetchDashboardBootstrap(): Promise<DashboardBootstrapResponse> {
    const requests = {
      accountInfo: this.getAccountInfo(),
      carriers: this.getLinkedCarriers(),
      sbpSubscription: this.getSbpSubscriptionState(),
      maasUser: this.getMaasUserInfo(),
      trips: this.getTrips(),
      operations: this.getOperations(),
    };

    const entries = Object.entries(requests) as Array<[keyof Omit<DashboardBootstrapResponse, 'failures'>, Promise<unknown>]>;
    const results = await Promise.allSettled(entries.map(([, request]) => request));
    const response: DashboardBootstrapResponse = {
      accountInfo: null,
      carriers: null,
      sbpSubscription: null,
      maasUser: null,
      trips: null,
      operations: null,
      failures: [],
    };

    results.forEach((result, index) => {
      const key = entries[index][0];

      if (result.status === 'fulfilled') {
        response[key] = result.value;
        return;
      }

      response.failures.push({
        key,
        message: this.getErrorMessage(result.reason),
        status: this.getErrorStatus(result.reason),
      });
    });

    return response;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authExpiresAt');
  }

  private getOtpHeaders() {
    return {
      Accept: 'application/json',
      'Accept-Language': 'ru',
      Authorization: AUTH_BASIC_TOKEN,
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Device-ID': this.getDeviceId(),
    };
  }

  private getDeviceId() {
    const storageKey = 'deviceId';
    const savedDeviceId = localStorage.getItem(storageKey);

    if (savedDeviceId) {
      return savedDeviceId;
    }

    const generatedDeviceId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    localStorage.setItem(storageKey, generatedDeviceId);

    return generatedDeviceId;
  }

  private getErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown request error';
  }

  private getErrorStatus(error: unknown) {
    return axios.isAxiosError(error) ? error.response?.status : undefined;
  }
}

export const apiService = new ApiService();
