// TODO : shared package로 분리해서 api와 함께 사용하도록 변경
export interface DataAndMessageResponse<T> extends ApiResponse<T> {
  message: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface MessageResponse {
  message: string;
}
