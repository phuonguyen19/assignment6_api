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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User not found
 */
router.get('/:id', (req, res) => {
  const { id } = req.params
  const user = users.find((anItem) => anItem.id === id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  return res.json(user)
})

export default router