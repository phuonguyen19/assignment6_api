import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createRequire } from "node:module";
import indexRouter from "../index.js";
import usersRouter from "../users.js";

// todos.js uses CommonJS, so load it via createRequire
const require = createRequire(import.meta.url);
const createTodoRoutes = require("../todos.js");

const ALLOWED_STATES = new Set(["todo", "doing", "done"]);

function createTodoRepository(seed = []) {
  let items = seed.map((item) => ({ ...item }));

  return {
    findAll: () => items.map((item) => ({ ...item })),
    findById: (id) => {
      const found = items.find((item) => item.id === id);
      return found ? { ...found } : null;
    },
    insert: (todo) => {
      items.push({ ...todo });
      return { ...todo };
    },
    update: (id, patch) => {
      const idx = items.findIndex((item) => item.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...patch };
      return { ...items[idx] };
    },
  };
}

function createTodoService(repo, idGenerator = () => crypto.randomUUID()) {
  return {
    async getTodos(state) {
      if (state !== undefined && !ALLOWED_STATES.has(state)) {
        const err = new Error("Invalid state filter");
        err.statusCode = 400;
        throw err;
      }
      const all = repo.findAll();
      return state ? all.filter((item) => item.state === state) : all;
    },

    async getTodoById(id) {
      const todo = repo.findById(id);
      if (!todo) {
        const err = new Error("Todo not found");
        err.statusCode = 404;
        throw err;
      }
      return todo;
    },

    async createTodo(payload) {
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

      const created = {
        id: idGenerator(),
        title: payload.title.trim(),
        description: typeof payload.description === "string" ? payload.description : "",
        state,
      };
      return repo.insert(created);
    },

    async updateTodo(id, patch) {
      if (patch?.state !== undefined && !ALLOWED_STATES.has(patch.state)) {
        const err = new Error("Invalid state");
        err.statusCode = 400;
        throw err;
      }
      const updated = repo.update(id, {
        ...(patch?.title !== undefined ? { title: patch.title.trim() } : {}),
        ...(patch?.description !== undefined ? { description: patch.description } : {}),
        ...(patch?.state !== undefined ? { state: patch.state } : {}),
      });
      if (!updated) {
        const err = new Error("Todo not found");
        err.statusCode = 404;
        throw err;
      }
      return updated;
    },
  };
}

function buildIntegrationApp(todoService) {
  const app = express();
  app.use(express.json());

  app.use("/", indexRouter);
  app.use("/users", usersRouter);
  app.use("/todos", createTodoRoutes(todoService));

  // If you add PUT /:id to todos.js or mount an update route, wire it consistently
  app.put("/todos/:id", async (req, res) => {
    try {
      const updated = await todoService.updateTodo(req.params.id, req.body);
      res.status(200).json(updated);
    } catch (error) {
      const status = error.statusCode ?? (error.message === "Todo not found" ? 404 : 400);
      res.status(status).json({ error: error.message });
    }
  });

  // Malformed JSON & fallback error handler (matches app.js)
  app.use((err, _req, res, _next) => {
    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }
    const status = err.statusCode ?? 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  });

  return app;
}

describe("REST API integration tests", () => {
  const SEED_ID = "7ba70388-2eca-427d-b5d9-8a4670b57f04";
  let server;
  let baseUrl;

  beforeEach(async () => {
    const repo = createTodoRepository([
      {
        id: SEED_ID,
        title: "Existing weekly task",
        description: "Seeded item",
        state: "todo",
      },
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Completed task",
        description: "Already done",
        state: "done",
      },
    ]);

    const todoService = createTodoService(repo);
    const app = buildIntegrationApp(todoService);

    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  // --- GET / & GET /users ---
  it("GET / returns 200 and running status", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: "running" });
  });

  it("GET /users returns 200 with list and GET /users/:id returns 404 for unknown id", async () => {
    const listRes = await fetch(`${baseUrl}/users`);
    assert.equal(listRes.status, 200);
    const users = await listRes.json();
    assert.equal(Array.isArray(users), true);
    assert.equal(users.length, 2);

    const notFoundRes = await fetch(`${baseUrl}/users/does-not-exist`);
    assert.equal(notFoundRes.status, 404);
    assert.deepEqual(await notFoundRes.json(), { error: "User not found" });
  });

  // --- GET /todos ---
  it("GET /todos returns 200 and all todos", async () => {
    const res = await fetch(`${baseUrl}/todos`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.length, 2);
  });

  it("GET /todos?state=todo returns 200 and only matching todos", async () => {
    const res = await fetch(`${baseUrl}/todos?state=todo`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.length, 1);
    assert.equal(body[0].state, "todo");
    assert.equal(body[0].id, SEED_ID);
  });

  it("GET /todos/:id returns 404 when todo does not exist", async () => {
    const res = await fetch(`${baseUrl}/todos/1010`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, "Todo not found");
  });

  // --- POST /todos ---
  it("POST /todos returns 201 and persists the created todo", async () => {
    const payload = {
      title: "Finish the weekly assignment",
      description: "The current assignment is nr 4",
      state: "todo",
    };

    const postRes = await fetch(`${baseUrl}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.equal(postRes.status, 201);
    const created = await postRes.json();
    assert.ok(typeof created.id === "string" && created.id.length > 0);
    assert.equal(created.title, payload.title);
    assert.equal(created.description, payload.description);
    assert.equal(created.state, "todo");

    // Verify persistence via follow-up GET
    const getRes = await fetch(`${baseUrl}/todos/${created.id}`);
    assert.equal(getRes.status, 200);
    assert.deepEqual(await getRes.json(), created);
  });

  it("POST /todos with missing title returns 400", async () => {
    const res = await fetch(`${baseUrl}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Missing title should fail validation",
        state: "todo",
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, "Title is required");
  });

  it("POST /todos with malformed JSON returns 400", async () => {
    const res = await fetch(`${baseUrl}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: `
    "title": "Finish the weekly assignment",
    "description": "The current assignment is nr 4",
    "state": "todo"
`,
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, "Invalid JSON payload");
  });

  // --- PUT /todos/:id ---
  it("PUT /todos/:id returns 200 and updates existing todo state", async () => {
    const res = await fetch(`${baseUrl}/todos/${SEED_ID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "done" }),
    });

    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.equal(updated.id, SEED_ID);
    assert.equal(updated.state, "done");
  });

  it("PUT /todos/:id returns 404 when updating non-existent todo", async () => {
    const res = await fetch(`${baseUrl}/todos/1010`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "done" }),
    });

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, "Todo not found");
  });
});