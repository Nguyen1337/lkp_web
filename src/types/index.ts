// Пассажир
export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Профиль пассажира
export interface PassengerProfile extends Passenger {
  middleName?: string;
  dateOfBirth?: string;
  passport?: string;
  documentNumber?: string;
  nationality?: string;
}

// Бронирование
export interface Booking {
  id: string;
  passengerId: string;
  tripId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  bookingDate: string;
  seat?: string;
  price: number;
  currency: string;
  trip?: Trip;
  createdAt: string;
  updatedAt: string;
}

// Рейс/Маршрут
export interface Trip {
  id: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  busNumber?: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
  currency: string;
  duration?: string;
  status?: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
}

// История платежей
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: 'CARD' | 'CASH' | 'ONLINE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  date: string;
  createdAt: string;
}

// Уведомление
export interface Notification {
  id: string;
  passengerId: string;
  type: 'BOOKING' | 'PAYMENT' | 'TRIP' | 'PROMOTION' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  date: string;
  actionUrl?: string;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Пагинация
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
