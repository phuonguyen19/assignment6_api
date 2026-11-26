import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { toCsv } from '../services/todos.js'

const router = express.Router()

const VALID_STATES = ['todo', 'doing', 'done']

// In-memory store (reset helper exported for integration tests)
export let todos = []

export function resetTodos(initialTodos = []) {
  todos.length = 0
  todos.push(...initialTodos)
}

function isValidState(state) {
  return VALID_STATES.includes(state)
}

/**
 * @openapi
 * /todos:
 *   post:
 *     summary: Create a todo
 *     description: Creates a new todo item and returns it with status 201, including createdAt and updatedAt timestamps.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTodoInput'
 *           example:
 *             title: Write API documentation
 *             description: OpenAPI + README examples
 *             state: todo
 *     responses:
 *       201:
 *         description: Todo created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodoItem'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', (req, res) => {
  const { title, description = '', state = 'todo' } = req.body ?? {}

  if (typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' })
  }

  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ error: 'Description must be a string' })
  }

  if (!isValidState(state)) {
    return res.status(400).json({ error: 'State must be one of: todo, doing, done' })
  }

  const now = new Date().toISOString()
  const newTodo = {
    id: uuidv4(),
    title: title.trim(),
    description,
    state,
    createdAt: now,
    updatedAt: now
  }

  todos.push(newTodo)
  return res.status(201).json(newTodo)
})

/**
 * @openapi
 * /todos:
 *   get:
 *     summary: Get all todos
 *     description: Returns all todo items, optionally filtered by state query parameter.
 *     parameters:
 *       - in: query
 *         name: state
 *         required: false
 *         schema:
 *           $ref: '#/components/schemas/TodoState'
 *         description: Filter todos by state (todo, doing, done)
 *     responses:
 *       200:
 *         description: List of todos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TodoItem'
 *       400:
 *         description: Invalid state query parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', (req, res) => {
  const { state } = req.query

  if (state !== undefined) {
    if (typeof state !== 'string' || !isValidState(state)) {
      return res.status(400).json({ error: 'Invalid state filter. Use todo, doing, or done' })
    }
    return res.status(200).json(todos.filter((item) => item.state === state))
  }

  return res.status(200).json(todos)
})

/**
 * @openapi
 * /todos/{id}:
 *   get:
 *     summary: Get a single todo by ID
 *     description: Returns a single todo item in JSON format.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Todo ID
 *     responses:
 *       200:
 *         description: Requested todo item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodoItem'
 *       404:
 *         description: Todo not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', (req, res) => {
  const todo = todos.find((item) => item.id === req.params.id)
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' })
  }
  return res.status(200).json(todo)
})

/**
 * @openapi
 * /todos/{id}:
 *   put:
 *     summary: Update a todo
 *     description: Updates fields of an existing todo item and returns all todo attributes with an updated updatedAt timestamp.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Todo ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTodoInput'
 *           example:
 *             state: doing
 *     responses:
 *       200:
 *         description: Updated todo item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodoItem'
 *       400:
 *         description: Invalid update payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Todo not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', (req, res) => {
  const todo = todos.find((item) => item.id === req.params.id)
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' })
  }

  const { title, description, state } = req.body ?? {}

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title must be a non-empty string' })
    }
    todo.title = title.trim()
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      return res.status(400).json({ error: 'Description must be a string' })
    }
    todo.description = description
  }

  if (state !== undefined) {
    if (!isValidState(state)) {
      return res.status(400).json({ error: 'State must be one of: todo, doing, done' })
    }
    todo.state = state
  }

  todo.updatedAt = new Date().toISOString()
  return res.status(200).json(todo)
})

/**
 * @openapi
 * /todos/{id}:
 *   delete:
 *     summary: Delete a todo
 *     description: Deletes a todo item by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Todo ID
 *     responses:
 *       200:
 *         description: Todo deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Todo deleted
 *       404:
 *         description: Todo not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', (req, res) => {
  const index = todos.findIndex((item) => item.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' })
  }

  todos.splice(index, 1)
  return res.status(200).json({ message: 'Todo deleted' })
})
router.get('/', (req, res) => {
  const { state } = req.query
  const format = req.accepts(['application/json', 'text/csv'])

  let filteredTodos = todos

  if (state !== undefined) {
    if (typeof state !== 'string' || !isValidState(state)) {
      return res.status(400).json({ error: 'Invalid state filter. Use todo, doing, or done' })
    }
    filteredTodos = todos.filter((item) => item.state === state)
  }

  if (format === 'text/csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    return res.status(200).send(toCsv(filteredTodos))
  }

  if (!format) {
    return res.status(406).json({ error: 'Not Acceptable. Supported formats: application/json, text/csv' })
  }

  return res.status(200).json(filteredTodos)
})
export default router