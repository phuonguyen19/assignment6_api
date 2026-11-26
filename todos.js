import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createRequire } from "node:module";

// todos.js uses CommonJS (module.exports)
const require = createRequire(import.meta.url);
const createTodoRoutes = require("../todos.js");

describe("createTodoRoutes unit tests", () => {
  let server;

  async function startTestServer(mockTodoService) {
    const app = express();
    app.use(express.json());
    app.use("/todos", createTodoRoutes(mockTodoService));

    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    return `http://127.0.0.1:${port}`;
  }

  afterEach(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = null;
    }
  });

  it("GET /todos returns 200 and passes query.state to todoService.getTodos", async () => {
    let receivedState;
    const baseUrl = await startTestServer({
      getTodos: async (state) => {
        receivedState = state;
        return [{ id: "1", title: "Test", state: "todo" }];
      },
    });

    const res = await fetch(`${baseUrl}/todos?state=todo`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(receivedState, "todo");
    assert.equal(body.length, 1);
  });

  it("GET /todos returns 500 when todoService.getTodos throws", async () => {
    const baseUrl = await startTestServer({
      getTodos: async () => {
        throw new Error("Database failure");
      },
    });

    const res = await fetch(`${baseUrl}/todos`);
    const body = await res.json();

    assert.equal(res.status, 500);
    assert.deepEqual(body, { error: "Database failure" });
  });

  it("GET /todos/:id returns 200 when todo exists", async () => {
    const baseUrl = await startTestServer({
      getTodoById: async (id) => ({ id, title: "Found item", state: "todo" }),
    });

    const res = await fetch(`${baseUrl}/todos/abc-123`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.id, "abc-123");
  });

  it("GET /todos/:id returns 404 when todoService throws 'Todo not found'", async () => {
    const baseUrl = await startTestServer({
      getTodoById: async () => {
        throw new Error("Todo not found");
      },
    });

    const res = await fetch(`${baseUrl}/todos/missing-id`);
    const body = await res.json();

    assert.equal(res.status, 404);
    assert.deepEqual(body, { error: "Todo not found" });
  });

  it("POST /todos returns 201 with created todo on valid payload", async () => {
    const baseUrl = await startTestServer({
      createTodo: async (payload) => ({ id: "new-1", ...payload }),
    });

    const res = await fetch(`${baseUrl}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Todo", state: "todo" }),
    });
    const body = await res.json();

    assert.equal(res.status, 201);
    assert.deepEqual(body, { id: "new-1", title: "New Todo", state: "todo" });
  });

  it("POST /todos returns 400 when todoService.createTodo rejects invalid input", async () => {
    const baseUrl = await startTestServer({
      createTodo: async () => {
        throw new Error("Title is required");
      },
    });

    const res = await fetch(`${baseUrl}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.deepEqual(body, { error: "Title is required" });
  });
});