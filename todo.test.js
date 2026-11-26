import request from 'supertest'
import app from '../app.js'
import { resetTodos } from '../routes/todo.js'

beforeEach(() => {
  resetTodos()
})

describe('Todo API Integration Tests', () => {
  test('POST /todos creates a todo with 201, id, createdAt, and updatedAt', async () => {
    const payload = {
      title: 'Write API documentation',
      description: 'OpenAPI + README examples',
      state: 'todo'
    }

    const res = await request(app).post('/todo').send(payload)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      title: 'Write API documentation',
      description: 'OpenAPI + README examples',
      state: 'todo'
    })
    expect(res.body.id).toBeDefined()
    expect(res.body.createdAt).toBeDefined()
    expect(res.body.updatedAt).toBeDefined()
  })

  test('POST /todos returns 400 for missing title or invalid state', async () => {
    const missingTitleRes = await request(app).post('/todos').send({
      description: 'Missing title'
    })
    expect(missingTitleRes.status).toBe(400)

    const invalidStateRes = await request(app).post('/todos').send({
      title: 'Invalid state item',
      state: 'invalid-state'
    })
    expect(invalidStateRes.status).toBe(400)
  })

  test('GET /todos returns all todos and filters by ?state=todo|doing|done', async () => {
    await request(app).post('/todos').send({ title: 'Task 1', state: 'todo' })
    await request(app).post('/todos').send({ title: 'Task 2', state: 'doing' })
    await request(app).post('/todos').send({ title: 'Task 3', state: 'done' })

    const allRes = await request(app).get('/todo')
    expect(allRes.status).toBe(200)
    expect(allRes.body).toHaveLength(3)

    const doingRes = await request(app).get('/todos?state=doing')
    expect(doingRes.status).toBe(200)
    expect(doingRes.body).toHaveLength(1)
    expect(doingRes.body[0].title).toBe('Task 2')

    const badFilterRes = await request(app).get('/todos?state=unknown')
    expect(badFilterRes.status).toBe(400)
  })

  test('GET /todos/:id returns 200 with item or 404 when not found', async () => {
    const created = await request(app).post('/todos').send({
      title: 'Single item',
      description: 'Details',
      state: 'todo'
    })

    const foundRes = await request(app).get(`/todos/${created.body.id}`)
    expect(foundRes.status).toBe(200)
    expect(foundRes.body.id).toBe(created.body.id)
    expect(foundRes.body.title).toBe('Single item')

    const missingRes = await request(app).get('/todos/non-existent-id')
    expect(missingRes.status).toBe(404)
  })

  test('PUT /todos/:id updates fields, refreshes updatedAt, and handles 400 / 404', async () => {
    const created = await request(app).post('/todo').send({
      title: 'Write API documentation',
      description: 'OpenAPI + README examples',
      state: 'todo'
    })

    const updateRes = await request(app)
      .put(`/todos/${created.body.id}`)
      .send({ state: 'doing' })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body).toMatchObject({
      id: created.body.id,
      title: 'Write API documentation',
      description: 'OpenAPI + README examples',
      state: 'doing',
      createdAt: created.body.createdAt
    })
    expect(updateRes.body.updatedAt).toBeDefined()

    const invalidUpdateRes = await request(app)
      .put(`/todos/${created.body.id}`)
      .send({ state: 'wrong' })
    expect(invalidUpdateRes.status).toBe(400)

    const missingUpdateRes = await request(app)
      .put('/todos/non-existent-id')
      .send({ state: 'done' })
    expect(missingUpdateRes.status).toBe(404)
  })

  test('DELETE /todos/:id deletes an existing todo and returns 404 for unknown id', async () => {
    const created = await request(app).post('/todos').send({
      title: 'Delete me',
      state: 'todo'
    })

    const deleteRes = await request(app).delete(`/todos/${created.body.id}`)
    expect(deleteRes.status).toBe(200)

    const afterDeleteRes = await request(app).get(`/todos/${created.body.id}`)
    expect(afterDeleteRes.status).toBe(404)

    const missingDeleteRes = await request(app).delete('/todos/non-existent-id')
    expect(missingDeleteRes.status).toBe(404)
  })

  test('GET /doc serves Swagger UI HTML', async () => {
    const docRes = await request(app).get('/doc/')
    expect(docRes.status).toBe(200)
    expect(docRes.text).toContain('Swagger UI')
  })
})