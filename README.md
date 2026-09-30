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

# Create the SQLite database with the seed jokes
npm run db:init

# Start the development server (it also builds the admin CSS)
npm run dev
```

The API will be running at `http://localhost:3000`

## Available Scripts

```bash
npm start                  # Start production server (run npm run build first)
npm run dev                # Start development server with auto-reload
npm run build              # Build the admin CSS and compile TypeScript
npm run build:css          # Build the admin CSS and copy the fonts
npm run db:init            # Seed an empty database
npm run db:init -- --force # Reset jokes, votes and stats (keeps admins)
npm test                   # Run test suite
```

## Admin Panel

A web panel at `/admin` lets admins list, search, create, edit and delete jokes. Deleting a joke also deletes its votes and views.

### Create the first admin

Admins are managed only with the CLI:

```bash
npm run admin:create -- --email ana@example.com
```

The command asks for the password two times and does not show it. A password must have 12 to 128 characters.

Where no interactive terminal exists (Docker, CI, deploy scripts), give the password on standard input:

```bash
printf '%s\n' "$ADMIN_PASSWORD" | npm run admin:create -- --email ana@example.com --password-stdin
```

### Admin commands

```bash
npm run admin:create -- --email <email> [--password-stdin]   # Create an admin
npm run admin:list                                           # List admins (id, email, creation date)
npm run admin:delete -- --email <email>                      # Delete an admin and close their sessions
npm run admin:password -- --email <email> [--password-stdin] # Change a password and close all sessions
```

### Use the panel

1. Run `npm run dev`.
2. Open `http://localhost:3000/admin`.
3. Log in with the email and password of an admin.

Sessions end 24 hours after login. The panel does not limit login attempts, but it checks at most 4 passwords at the same time. See [docs/specs/admin-panel.md](docs/specs/admin-panel.md) for the full behavior and [docs/decisions/](docs/decisions/) for the decisions.

### Production

- Run `npm run build` before `npm start`. The admin CSS is generated and is not in git.
- Serve the panel over HTTPS. The session cookie has the `Secure` attribute. Do not set `COOKIE_SECURE=false` in production.
- The `/admin` routes return HTML. They are not in the OpenAPI spec.

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