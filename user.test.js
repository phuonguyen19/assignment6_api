import request from 'supertest'
import app from '../app.js'
import { users, resetUsers } from '../routes/users.js'

beforeEach(() => {
  resetUsers()
})

describe('Users API Integration Tests', () => {
  test('GET /users returns seeded users with status 200', async () => {
    const res = await request(app).get('/users')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(2)
    expect(res.body.map((u) => u.name)).toEqual(['Alice', 'Bob'])
  })

  test('POST /users creates a user with status 201 and rejects empty name with 400', async () => {
    const res = await request(app).post('/users').send({ name: 'Charlie' })

    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.name).toBe('Charlie')

    const badRes = await request(app).post('/users').send({ name: '' })
    expect(badRes.status).toBe(400)
  })

  test('GET /users/:id returns 200 for existing user and 404 when not found', async () => {
    const targetUser = users[0]
    const res = await request(app).get(`/users/${targetUser.id}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual(targetUser)

    const missingRes = await request(app).get('/users/non-existent-id')
    expect(missingRes.status).toBe(404)
  })

  test('PUT /users/:id updates user name with 200 and handles 400 / 404', async () => {
    const targetUser = users[0]
    const res = await request(app).put(`/users/${targetUser.id}`).send({ name: 'Alicia' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: targetUser.id, name: 'Alicia' })

    const badRes = await request(app).put(`/users/${targetUser.id}`).send({ name: '   ' })
    expect(badRes.status).toBe(400)

    const missingRes = await request(app).put('/users/non-existent-id').send({ name: 'Nobody' })
    expect(missingRes.status).toBe(404)
  })

  test('DELETE /users/:id deletes user with 200 and returns 404 for unknown id', async () => {
    const targetUser = users[1]
    const res = await request(app).delete(`/users/${targetUser.id}`)

    expect(res.status).toBe(200)

    const afterDeleteRes = await request(app).get(`/users/${targetUser.id}`)
    expect(afterDeleteRes.status).toBe(404)

    const missingRes = await request(app).delete('/users/non-existent-id')
    expect(missingRes.status).toBe(404)
  })
})