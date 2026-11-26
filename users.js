import express from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

const createInitialUsers = () => [
  { id: uuidv4(), name: 'Alice' },
  { id: uuidv4(), name: 'Bob' }
]

// Simulated database
export let users = createInitialUsers()

export function resetUsers(initialUsers = createInitialUsers()) {
  users.length = 0
  users.push(...initialUsers)
}

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Returns a list of all users.
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 required:
 *                   - id
 *                   - name
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     example: 550e8400-e29b-41d4-a716-446655440000
 *                   name:
 *                     type: string
 *                     example: Alice
 */
router.get('/', (req, res) => {
  res.json(users)
})

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create a user
 *     description: Creates a new user and returns it with status 201.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Charlie
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - id
 *                 - name
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: 550e8400-e29b-41d4-a716-446655440000
 *                 name:
 *                   type: string
 *                   example: Charlie
 *       400:
 *         description: Invalid input data
 */
router.post('/', (req, res) => {
  const { name } = req.body ?? {}

  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required and must be a non-empty string' })
  }

  const newUser = {
    id: uuidv4(),
    name: name.trim()
  }

  users.push(newUser)
  return res.status(201).json(newUser)
})

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     description: Returns a single user object or 404 if not found.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Requested user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - id
 *                 - name
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: 550e8400-e29b-41d4-a716-446655440000
 *                 name:
 *                   type: string
 *                   example: Alice
 *       404:
 *         description: User not found
 */
router.get('/:id', (req, res) => {
  const { id } = req.params
  const user = users.find((anItem) => anItem.id === id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  return res.json(user)
})

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Updates an existing user's name and returns status 200.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Alicia
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - id
 *                 - name
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: 550e8400-e29b-41d4-a716-446655440000
 *                 name:
 *                   type: string
 *                   example: Alicia
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User not found
 */
router.put('/:id', (req, res) => {
  const { id } = req.params
  const user = users.find((anItem) => anItem.id === id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const { name } = req.body ?? {}
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required and must be a non-empty string' })
  }

  user.name = name.trim()
  return res.status(200).json(user)
})

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes a user by ID and returns status 200.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted
 *       404:
 *         description: User not found
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params
  const index = users.findIndex((anItem) => anItem.id === id)
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' })
  }

  users.splice(index, 1)
  return res.status(200).json({ message: 'User deleted' })
})

export default router