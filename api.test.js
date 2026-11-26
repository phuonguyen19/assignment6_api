import { describe, test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import app from "../src/app.js"

beforeEach(() => {
    // Setup code before each test, if needed
})
afterEach(() => {
    // Cleanup code after each test, if needed
})

describe('GET /users', () => {
    test('responds with 200 and JSON', async () => {
        const res = await request(app)
            .get('/users')
            .expect('Content-Type', /json/i)
            .expect(200)
        assert.ok(Array.isArray(res.body))
    })
})

describe('GET /users/:id', () => {
    test('responds with 200 and the user object for existing user', async () => {
        const users = await request(app)
            .get('/users')
            .expect(200)
        
        const alice = users.body.find(user => user.name === 'Alice')

        assert(alice, 'Alice should exist in the users list')
        const res = await request(app)
            .get(`/users/${alice.id}`)
            .expect('Content-Type', /json/i)
            .expect(200)
        assert.deepStrictEqual(res.body, alice)
    })

    test('responds with 404 for non-existing user', async () => {
        await request(app)
            .get('/users/9999999')
            .expect(404)
    })

    // the most common status codes
    // 200 OK: The request was successful, and the server returned the requested data.
    // 201 Created: The request was successful, and a new resource was created as a result.
    // 400 Bad Request: The server could not understand the request due to invalid syntax.
    // 401 Unauthorized: The client must authenticate itself to get the requested response.
    // 403 Forbidden: The client does not have access rights to the content.
    // 404 Not Found: The server can not find the requested resource.
    // 500 Internal Server Error: The server has encountered a situation it doesn't know how to handle.
})