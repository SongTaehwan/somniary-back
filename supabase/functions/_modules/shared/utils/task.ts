import { toError } from "../adapters/http/format/normalize.ts";

type Task<T> = Promise<T> | T;
type Thunk<T> = () => Task<T>;

type TaskResult<T> =
  | { success: true; failed: false; value: T }
  | { success: false; failed: true; error: Error };

export async function task<T>(
  task: Thunk<T>,
  labelForError?: string
): Promise<TaskResult<T>>;

export async function task<T>(
  task: Task<T>,
  labelForError?: string
): Promise<TaskResult<T>>;

export async function task<T>(
  task: Thunk<T> | Task<T>,
  labelForError: string = "task"
): Promise<TaskResult<T>> {
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

    return {
      success: false,
      failed: true,
      error: Object.assign(error, { cause: labelForError }),
    };
  }
}
