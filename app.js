import fs from 'node:fs'
import express from 'express'
import swaggerUi from 'swagger-ui-express'

import indexRouter from './routes/index.js'
import usersRouter from './routes/user.js'
import todosRouter from './routes/todo.js'

const swaggerSpec = JSON.parse(
  fs.readFileSync(new URL('./openApi.json', import.meta.url), 'utf8')
)

const app = express()

app.use(express.json())

// Swagger UI at http://localhost:3000/doc
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/todos', todosRouter)

export default app
