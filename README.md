# ChiquitoAPIjarl 🎭

A REST API that serves jokes and expressions from the legendary Spanish comedian Chiquito de la Calzada.

## Features

- 🎯 Get all jokes with optional category filtering
- 🎲 Get random jokes
- 🔍 Find specific jokes by ID
- 💾 JSON file data storage
- 🧪 Comprehensive test suite
- 📚 OpenAPI documentation

## Quick Start

### Prerequisites

- Node.js >= 21.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd chiquito-api-flow

# Install dependencies
npm install

# Start the development server
npm run dev
```

The API will be running at `http://localhost:3000`

## Available Scripts

```bash
npm start     # Start production server
npm run dev   # Start development server with auto-reload
npm test      # Run test suite
```

## API Endpoints

### Health Check
- **GET** `/health` - API health status

### Jokes
- **GET** `/api/jokes` - Get all jokes
- **GET** `/api/jokes?category=clásico` - Filter jokes by category
- **GET** `/api/jokes/random` - Get a random joke
- **GET** `/api/jokes/:id` - Get a specific joke by ID

### Categories
- **GET** `/api/categories` - Get all available joke categories with counts

## Example Responses

### Get All Jokes
```bash
curl http://localhost:3000/api/jokes
```

```json
[
  {
    "id": 1,
    "type": "phrase",
    "content": "¡Hasta luego, Lucas!",
    "category": "clásico"
  },
  {
    "id": 2,
    "type": "phrase", 
    "content": "¡Te das cuen!",
    "category": "clásico"
  }
]
```

### Get Random Joke
```bash
curl http://localhost:3000/api/jokes/random
```

```json
{
  "id": 5,
  "type": "phrase",
  "content": "¡Fistro duodenal!",
  "category": "clásico"
}
```

### Get All Categories
```bash
curl http://localhost:3000/api/categories
```

```json
[
  {
    "name": "clásico",
    "count": 10
  },
  {
    "name": "crisis",
    "count": 1
  },
  {
    "name": "comparaciones", 
    "count": 2
  },
  {
    "name": "absurdo",
    "count": 2
  },
  {
    "name": "familia",
    "count": 2
  }
]
```



## Project Structure

```
├── src/
│   ├── app.js      # Express app configuration and routes
│   └── server.js   # Server initialization
├── data/
│   └── chiquito.json # Jokes database
├── tests/
│   └── app.test.js   # Test suite
├── docs/
│   └── openapi.yml   # API documentation
└── package.json
```

## Data Structure

Each joke has the following structure:

```json
{
  "id": 1,
  "type": "phrase|joke",
  "content": "Joke or phrase content",
  "category": "Category name"
}
```

## Testing

The project includes a comprehensive test suite covering all endpoints:

```bash
npm test
```

Tests include:
- ✅ Get all jokes
- ✅ Filter jokes by category
- ✅ Get random jokes
- ✅ Get specific jokes by ID
- ✅ Error handling (404, 500)

## Technical Stack

- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **CORS**: Enabled without restrictions
- **Testing**: Node.js built-in test runner + Supertest
- **Documentation**: OpenAPI 3.0.4

## API Documentation

Full OpenAPI documentation is available in `/docs/openapi.yml`. The API follows RESTful conventions with:

- Proper HTTP status codes
- JSON responses
- Consistent error message format
- Query parameter support for filtering

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Joke not found, fistro"
}
```

Error messages maintain the Chiquito style with references like "fistro" for consistency.

## Development Guidelines

- No inline comments - code should be self-documenting
- All code and documentation in English
- Use descriptive variable and function names
- Modern JavaScript (ES6+) features
- Clean, readable code patterns

## License

MIT

---

*¡Hasta luego, Lucas! 👋*