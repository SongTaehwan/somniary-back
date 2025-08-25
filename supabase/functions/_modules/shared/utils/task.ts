import { toError } from "../adapters/http/format/normalize.ts";

type Task<T> = Promise<T> | T;
type Thunk<T> = () => Task<T>;

export type TaskResult<T> = TaskSuccess<T> | TaskFailed;

type TaskSuccess<T> = { success: true; failed: false; value: T };
type TaskFailed = {
  success: false;
  failed: true;
  error: Error;
};

type TaskOptions = {
  labelForError?: string;
  throwError?: boolean;
};

// handle error manually in general
export async function task<T>(
  task: Thunk<T>,
  options?: {
    labelForError?: string;
    throwError?: false;
  }
): Promise<TaskResult<T>>;

export async function task<T>(
  task: Task<T>,
  options?: {
    labelForError?: string;
    throwError?: false;
  }
): Promise<TaskResult<T>>;

// throw error if failed and return success  if not
export async function task<T>(
  task: Thunk<T>,
  options?: {
    labelForError?: string;
    throwError?: true;
  }
): Promise<TaskSuccess<T>>;

export async function task<T>(
  task: Task<T>,
  options?: {
    labelForError?: string;
    throwError?: true;
  }
): Promise<TaskSuccess<T>>;

export async function task<T>(
  task: Thunk<T> | Task<T>,
  options: TaskOptions = {
    labelForError: "task",
    throwError: false,
  }
): Promise<TaskResult<T>> {
  const { labelForError = "task", throwError } = options;

  try {
    const value = await (typeof task === "function"
      ? (task as Thunk<T>)()
      : task);

    return {
      success: true,
      failed: false,
      value,
    };
  } catch (err) {
    const error = toError(err);

    if (throwError) {
      throw Object.assign(error, { cause: error.cause ?? labelForError });
    }

    return {
      success: false,
      failed: true,
      error: Object.assign(error, { cause: error.cause ?? labelForError }),
    };
  }
}
