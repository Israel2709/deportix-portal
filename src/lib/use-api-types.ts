export interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}
