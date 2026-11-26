// services/todos.service.js
const ALLOWED_STATES = new Set(["todo", "doing", "done"]);

export function createTodosService({ store, idGenerator = () => crypto.randomUUID() }) {
  function listTodos({ state } = {}) {
    if (state !== undefined && !ALLOWED_STATES.has(state)) {
      const err = new Error("Invalid state filter");
      err.statusCode = 400;
      throw err;
    }
    const items = store.findAll();
    return state ? items.filter((item) => item.state === state) : items;
  }

  function getTodoById(id) {
    const todo = store.findById(id);
    if (!todo) {
      const err = new Error("Todo not found");
      err.statusCode = 404;
      throw err;
    }
    return todo;
  }

  function createTodo(payload) {
    if (!payload || typeof payload.title !== "string" || payload.title.trim() === "") {
      const err = new Error("Title is required");
      err.statusCode = 400;
      throw err;
    }
    const state = payload.state ?? "todo";
    if (!ALLOWED_STATES.has(state)) {
      const err = new Error("Invalid state");
      err.statusCode = 400;
      throw err;
    }

    const todo = {
      id: idGenerator(),
      title: payload.title.trim(),
      description: typeof payload.description === "string" ? payload.description : "",
      state,
    };
    return store.insert(todo);
  }

  function updateTodo(id, patch) {
    const existing = getTodoById(id);
    if (patch?.state !== undefined && !ALLOWED_STATES.has(patch.state)) {
      const err = new Error("Invalid state");
      err.statusCode = 400;
      throw err;
    }
    const updated = {
      ...existing,
      ...(patch?.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch?.description !== undefined ? { description: patch.description } : {}),
      ...(patch?.state !== undefined ? { state: patch.state } : {}),
    };
    return store.update(id, updated);
  }

  return { listTodos, getTodoById, createTodo, updateTodo };
}