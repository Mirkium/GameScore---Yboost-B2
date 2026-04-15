export interface JwtPayload {
  id: string;
  email: string;
  username?: string;
}

export interface AuthenticatedRequest {
  user?: JwtPayload;
}

export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly count: number;
  readonly page: number;
  readonly pageSize: number;
}

export * from './presenters';
export * from './dtos';