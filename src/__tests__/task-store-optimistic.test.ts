import { useTaskStore } from "@/store/task";

import { Task, TaskStatus } from "@/types/task";

const originalFetch = global.fetch;
let consoleWarning: jest.SpyInstance;

const task = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  title: "Original title",
  status: TaskStatus.TODO,
  tags: [],
  createdAt: new Date("2026-09-14T12:00:00.000Z"),
  updatedAt: new Date("2026-09-14T12:00:00.000Z"),
  isRecurring: false,
  isAutoScheduled: false,
  scheduleLocked: false,
  ...overrides,
});

beforeEach(() => {
  jest.useFakeTimers();
  consoleWarning = jest.spyOn(console, "warn").mockImplementation(() => {});
  useTaskStore.setState({
    tasks: [task()],
    tags: [],
    loading: false,
    error: null,
  });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  global.fetch = originalFetch;
  consoleWarning.mockRestore();
});

it("updates the visible task before persistence finishes", async () => {
  let finishRequest!: (response: Response) => void;
  global.fetch = jest.fn(
    () =>
      new Promise<Response>((resolve) => {
        finishRequest = resolve;
      })
  );

  const request = useTaskStore
    .getState()
    .updateTask("task-1", { title: "Visible immediately" });

  expect(useTaskStore.getState().tasks[0].title).toBe("Visible immediately");
  expect(useTaskStore.getState().loading).toBe(false);

  finishRequest({
    ok: true,
    json: async () => task({ title: "Visible immediately" }),
  } as Response);
  await request;

  expect(useTaskStore.getState().tasks[0].title).toBe("Visible immediately");
});

it("restores the previous task when persistence fails", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    text: async () => "database unavailable",
  } as Response);

  const request = useTaskStore
    .getState()
    .updateTask("task-1", { title: "Temporary title" });

  expect(useTaskStore.getState().tasks[0].title).toBe("Temporary title");
  await expect(request).rejects.toThrow("database unavailable");
  expect(useTaskStore.getState().tasks[0].title).toBe("Original title");
});

it("restores a deleted task at its prior position when deletion fails", async () => {
  useTaskStore.setState({
    tasks: [task(), task({ id: "task-2", title: "Second" })],
  });
  global.fetch = jest.fn().mockResolvedValue({ ok: false } as Response);

  const request = useTaskStore.getState().deleteTask("task-1");

  expect(useTaskStore.getState().tasks.map(({ id }) => id)).toEqual(["task-2"]);
  await expect(request).rejects.toThrow("Failed to delete task");
  expect(useTaskStore.getState().tasks.map(({ id }) => id)).toEqual([
    "task-1",
    "task-2",
  ]);
});
