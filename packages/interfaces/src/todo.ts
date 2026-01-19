export interface Todo {
  id: number;
  title: string;
  description: string;
  isDone: boolean;
  createdAt: Date;
}

export interface CreateTodoDto {
  title: string;
  description: string;
}

export interface PatchTodoDto {
  title?: string;
  description?: string;
}

export interface CreateTodoEventDtoInterface {
  id: number;
  title: string;
  description?: string;
  userId: number;
  isDone: boolean;
  createdAt: Date;
}

export interface UpdateTodoEventDtoInterface
  extends CreateTodoEventDtoInterface {}

export interface DeleteTodoEventDtoInterface
  extends CreateTodoEventDtoInterface {}
