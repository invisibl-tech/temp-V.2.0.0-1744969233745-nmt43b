/**
 * Updated: April 15, 2025
 */

export type ValueType = string | number | null | undefined;

export interface ChartData {
  date: string;
  value: ValueType;
  forecast?: ValueType;
  platform?: string;
  metric?: string;
}

export interface Platform {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  config?: Record<string, any>;
}
