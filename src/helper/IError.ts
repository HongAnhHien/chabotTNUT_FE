export interface IValidationFieldError {
  field: string;
  message: string;
  value?: unknown;
}

export interface IApiError {
  success: false;
  message: string;
  statusCode: number;
  errors?: IValidationFieldError[];
}

export interface IApiSuccess<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export type IApiResponse<T = unknown> = IApiSuccess<T> | IApiError;
