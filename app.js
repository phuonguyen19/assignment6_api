import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import indexRouter from "../index.js";
import usersRouter from "../users.js";

describe("index and users routers", () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    const app = express();
    app.use(express.json());
    app.use("/", indexRouter);
    app.use("/users", usersRouter);

    // Same JSON error handler as app.js
    app.use((err, _req, res, _next) => {
      if (err?.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Invalid JSON payload" });
      }
      const status = err.statusCode ?? 500;
      res.status(status).json({ error: err.message || "Internal server error" });
    });

    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("GET / returns status running", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: "running" });
  });

  it("GET /users returns initial list of users and GET /users/:id finds a valid user", async () => {
    const listRes = await fetch(`${baseUrl}/users`);
    assert.equal(listRes.status, 200);
    const users = await listRes.json();
    assert.equal(users.length, 2);

    const userRes = await fetch(`${baseUrl}/users/${users[0].id}`);
    assert.equal(userRes.status, 200);
    assert.equal((await userRes.json()).name, users[0].name);
  });

  it("GET /users/:id returns 404 for unknown user id", async () => {
    const res = await fetch(`${baseUrl}/users/unknown-id`);
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: "User not found" });
  });

  it("returns 400 when receiving malformed JSON", async () => {
    const res = await fetch(`${baseUrl}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '"title": "broken json without braces"',
    });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "Invalid JSON payload" });
  });
});