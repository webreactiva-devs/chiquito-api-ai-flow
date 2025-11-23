# Contributing to Chiquito API

Thank you for your interest in contributing to this project! This is a REST API that serves jokes from the legendary Spanish comedian Chiquito de la Calzada.

## Project Overview

This API provides endpoints to access a collection of Chiquito de la Calzada's most famous jokes and expressions. The API is built with Node.js and Express, serving data from a JSON file.

### Available Endpoints

- `GET /api/jokes` - Get all jokes or filter by category
- `GET /api/jokes/random` - Get a random joke
- `GET /api/jokes/:id` - Get a specific joke by ID

## Code Style Guidelines

### Important Code Standards

- **NO inline comments allowed** - The code should be self-documenting
- **All code descriptions must be in English** - Variables, functions, comments, and documentation
- **Clean and readable code** - Write code that explains itself through proper naming and structure

### Example of Good Code Style

```javascript
const getRandomJoke = (jokes) => {
  return jokes[Math.floor(Math.random() * jokes.length)];
};

const filterJokesByCategory = (jokes, category) => {
  return jokes.filter(joke => joke.category === category);
};
```

### Example of What NOT to Do

```javascript
// Don't use inline comments like this
const joke = jokes[Math.floor(Math.random() * jokes.length)]; // Gets random joke

// Don't use Spanish in code
const obtenerChiste = (chistes) => {
  return chistes[Math.floor(Math.random() * chistes.length)];
};
```

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. The API will be available at `http://localhost:3000`

## Project Structure

```
├── src/
│   ├── app.js          # Express application setup
│   └── server.js       # Server initialization
├── data/
│   └── chiquito.json   # Jokes data
├── tests/              # Test files
├── openapi.yml         # API documentation
└── package.json        # Dependencies and scripts
```

## Making Contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the code style guidelines above
4. Make your changes
5. Test your changes
6. Submit a pull request

## Testing

Make sure to test your changes before submitting a pull request. The API should respond correctly to all endpoints and maintain the expected JSON structure.

## Questions?

If you have any questions about contributing, please open an issue in the repository.

Remember: Keep it clean, keep it in English, and let the code speak for itself!
