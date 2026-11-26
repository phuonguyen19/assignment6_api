# Provide OpenAPI documentation for your server
A Node.js and Express REST API for managing todo items and users, documented with OpenAPI 3.0 (Swagger UI) and supporting both JSON and CSV responses on `GET /todos`.

## Project Structure

```text
assignment4/
├── src/
│   ├── routes/
│   │   ├── index.js
│   │   ├── todo.js
│   │   └── users.js
│   ├── services/
│   │   ├── todos.js
│   │   └── users.js
│   ├── app.js
│   ├── openApi.json
│   ├── server.js
│   └── swagger.js
├── tests/
│   ├── api.test.js
│   ├── todo.test.js
│   ├── unit.test.js
│   └── user.test.js
├── package.json
└── README.md
```

## Setup & Running the Server

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   node src/server.js
   ```
   The server runs at `http://localhost:3000`.

3. Verify the server status:
   ```http
   GET http://localhost:3000/
   ```
   Response (`200 OK`):
   ```json
   {
     "status": "running"
   }
   ```

## Part A: OpenAPI & Interactive Swagger UI Documentation

The API specification is defined using OpenAPI 3.0 (`src/openApi.json`) and served interactively via `swagger-ui-express` at:

- **Swagger UI:** `http://localhost:3000/doc`

### Testing Endpoints in Swagger UI
1. Start the server (`node src/server.js`).
2. Open `http://localhost:3000/doc` in your browser.
3. Expand any endpoint (`GET /`, `GET /todos`, `POST /todos`, `GET /todos/{id}`, `PUT /todos/{id}`, `DELETE /todos/{id}`, or `/users`).
4. Click **Try it out**, fill in parameters or the request body, and click **Execute** to test live requests against `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check (`{"status": "running"}`) |
| `POST` | `/todos` | Create a new todo item (`201 Created`) |
| `GET` | `/todos` | List all todos (supports `?state=todo\|doing\|done` and `Accept: application/json` or `text/csv`) |
| `GET` | `/todos/{id}` | Retrieve a single todo by UUID (`200` / `404`) |
| `PUT` | `/todos/{id}` | Update a todo item (`200` / `400` / `404`) |
| `DELETE` | `/todos/{id}` | Delete a todo item (`200` / `404`) |
| `GET` | `/users` | List all users |
| `POST` | `/users` | Create a new user |
| `GET` | `/users/{id}` | Retrieve a single user by UUID |
| `PUT` | `/users/{id}` | Update a user |
| `DELETE` | `/users/{id}` | Delete a user |

### Request & Response Examples

#### 1. Create a Todo (`POST /todos`)
Request:
```json
{
  "title": "Write API documentation",
  "description": "OpenAPI + README examples",
  "state": "todo"
}
```
Response (`201 Created`):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Write API documentation",
  "description": "OpenAPI + README examples",
  "state": "todo",
  "createdAt": "2026-11-26T09:00:00.000Z",
  "updatedAt": "2026-11-26T09:00:00.000Z"
}
```

#### 2. Update a Todo (`PUT /todos/{id}`)
Request:
```json
{
  "state": "doing"
}
```
Response (`200 OK`):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Write API documentation",
  "description": "OpenAPI + README examples",
  "state": "doing",
  "createdAt": "2026-11-26T09:00:00.000Z",
  "updatedAt": "2026-11-26T09:05:00.000Z"
}
```

## Part B: CSV Format Support on `GET /todos`

`GET /todos` supports content negotiation via the HTTP `Accept` header using `req.accepts(['application/json', 'text/csv'])` and converts items to CSV via `toCsv()` in `src/services/todos.js`.

### Request Example (REST Client / curl)
```http
GET http://localhost:3000/todos?state=done
Accept: text/csv
```

```bash
curl -H "Accept: text/csv" "http://localhost:3000/todos?state=done"
```

### Example CSV Response (`200 OK`, `Content-Type: text/csv`)
```csv
id,title,description,state,createdAt,updatedAt
"550e8400-e29b-41d4-a716-446655440000","Write API documentation","OpenAPI + README examples","done","2026-11-26T09:00:00.000Z","2026-11-26T09:05:00.000Z"
```

In Swagger UI (`http://localhost:3000/doc`), open **GET /todos**, click **Try it out**, and select **`text/csv`** in the **Media type** dropdown to test CSV output directly.

## Running Tests

Run the integration and unit test suite with:
```bash
npm test
```