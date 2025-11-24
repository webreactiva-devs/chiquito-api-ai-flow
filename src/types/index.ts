export interface Joke {
  id: number;
  type: string;
  content: string;
  category: string;
}

export interface Category {
  name: string;
  count: number;
}

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
}
