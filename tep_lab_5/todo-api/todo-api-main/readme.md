# todoapi-v00

**Swagger JSON:** [https://shiny-broccoli-5gvg4jj5x9w5c7rw-5004.app.github.dev/swagger/v1/swagger.json](https://shiny-broccoli-5gvg4jj5x9w5c7rw-5004.app.github.dev/swagger/v1/swagger.json)

---

## Endpoint

<details>
<summary>Todo</summary>

#### `GET /Todo`

**Description:** Get all todo items
**Parameters:** None

**Responses:**

| Code | Description | Example                                                                                     |
| ---- | ----------- | ------------------------------------------------------------------------------------------- |
| 200  | OK          | `json [ { "id": 0, "name": "string", "isComplete": true, "categoryId": 0, "listId": 0 } ] ` |

---

#### `POST /Todo`

**Description:** Create a new todo item

**Request Body (`application/json`):**

```json
{
  "id": 0,
  "name": "string",
  "isComplete": true,
  "categoryId": 0,
  "listId": 0
}
```

**Responses:**

| Code | Description | Example                                                                                 |
| ---- | ----------- | --------------------------------------------------------------------------------------- |
| 200  | OK          | `json { "id": 0, "name": "string", "isComplete": true, "categoryId": 0, "listId": 0 } ` |

---

#### `GET /Todo/{id}`

**Parameters:**

| Name | Type    | In   | Required | Description  |
| ---- | ------- | ---- | -------- | ------------ |
| id   | integer | path | ✔        | Todo item ID |

**Responses:**

| Code | Description | Example                                                                                 |
| ---- | ----------- | --------------------------------------------------------------------------------------- |
| 200  | OK          | `json { "id": 0, "name": "string", "isComplete": true, "categoryId": 0, "listId": 0 } ` |

---

#### `PUT /Todo/{id}`

**Parameters:**

| Name | Type    | In   | Required | Description  |
| ---- | ------- | ---- | -------- | ------------ |
| id   | integer | path | ✔        | Todo item ID |

**Request Body (`application/json`):**

```json
{
  "id": 0,
  "name": "string",
  "isComplete": true,
  "categoryId": 0,
  "listId": 0
}
```

**Responses:** 200 OK

---

#### `DELETE /Todo/{id}`

**Parameters:**

| Name | Type    | In   | Required | Description  |
| ---- | ------- | ---- | -------- | ------------ |
| id   | integer | path | ✔        | Todo item ID |

**Responses:** 200 OK

</details>

---

<details>
<summary>User</summary>

#### `GET /User`

**Description:** Get all users
**Parameters:** None

**Responses:**

| Code | Description | Example                                                                           |
| ---- | ----------- | --------------------------------------------------------------------------------- |
| 200  | OK          | `json [ { "id": 0, "name": "string", "surname": "string", "email": "string" } ] ` |

---

#### `POST /User`

**Request Body (`application/json`):**

```json
{
  "id": 0,
  "name": "string",
  "surname": "string",
  "email": "string"
}
```

**Responses:** 200 OK

---

#### `GET /User/{id}`

**Parameters:**

| Name | Type    | In   | Required | Description |
| ---- | ------- | ---- | -------- | ----------- |
| id   | integer | path | ✔        | User ID     |

**Responses:**

| Code | Description | Example                                                                       |
| ---- | ----------- | ----------------------------------------------------------------------------- |
| 200  | OK          | `json { "id": 0, "name": "string", "surname": "string", "email": "string" } ` |

---

#### `PUT /User/{id}`

**Parameters:**

| Name | Type    | In   | Required | Description |
| ---- | ------- | ---- | -------- | ----------- |
| id   | integer | path | ✔        | User ID     |

**Request Body (`application/json`):**

```json
{
  "id": 0,
  "name": "string",
  "surname": "string",
  "email": "string"
}
```

**Responses:** 200 OK

---

#### `DELETE /User/{id}`

**Parameters:**

| Name | Type    | In   | Required | Description |
| ---- | ------- | ---- | -------- | ----------- |
| id   | integer | path | ✔        | User ID     |

**Responses:** 200 OK

---

#### `GET /User/byemail/{email}`

**Parameters:**

| Name  | Type   | In   | Required | Description |
| ----- | ------ | ---- | -------- | ----------- |
| email | string | path | ✔        | User email  |

**Responses:**

| Code | Description | Example                                                                       |
| ---- | ----------- | ----------------------------------------------------------------------------- |
| 200  | OK          | `json { "id": 0, "name": "string", "surname": "string", "email": "string" } ` |

</details>

---

## Schemas

<details>
<summary>TodoItem</summary>

```json
{
  "id": 0,
  "name": "string",
  "isComplete": true,
  "categoryId": 0,
  "listId": 0
}
```

</details>

<details>
<summary>User</summary>

```json
{
  "id": 0,
  "name": "string",
  "surname": "string",
  "email": "string"
}
```

</details>