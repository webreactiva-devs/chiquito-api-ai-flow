# GitHub Copilot Instructions

## Project: Chiquito de la Calzada API

This is a REST API that serves jokes and expressions from the legendary Spanish comedian Chiquito de la Calzada.

## Code Style Requirements

### Mandatory Rules

1. **NO inline comments allowed**

   - Code must be self-documenting
   - Use descriptive variable and function names instead of comments
   - Write clean, readable code that explains itself

2. **All code descriptions in English**
   - Variable names in English
   - Function names in English
   - Documentation in English
   - Commit messages in English
   - Code comments (if absolutely necessary) in English

### Examples

#### ✅ Good Code Style

```javascript
const getRandomJoke = (jokes) => {
  return jokes[Math.floor(Math.random() * jokes.length)];
};

const filterJokesByCategory = (jokes, category) => {
  return jokes.filter((joke) => joke.category === category);
};

const findJokeById = (jokes, id) => {
  return jokes.find((joke) => joke.id === id);
};
```

#### ❌ Bad Code Style

```javascript
// Don't use inline comments
const joke = jokes[Math.floor(Math.random() * jokes.length)]; // Gets random joke

// Don't use Spanish in code
const obtenerChiste = (chistes) => {
  return chistes[Math.floor(Math.random() * chistes.length)];
};

// Don't use unclear variable names
const x = jokes.filter((j) => j.cat === cat); // What is x? What is cat?
```

## Technical Stack

- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Data**: JSON file storage
- **CORS**: Enabled without restrictions

## API Conventions

- RESTful endpoints
- JSON responses
- Proper HTTP status codes
- Consistent error message format
- Query parameter filtering support

## File Structure

```
src/
├── app.js      # Express app configuration and routes
└── server.js   # Server initialization
data/
└── chiquito.json # Jokes database
```

## When suggesting code:

1. Always follow the no-inline-comments rule
2. Use meaningful English names for everything
3. Keep functions small and focused
4. Use modern JavaScript (ES6+) features
5. Handle errors gracefully
6. Maintain consistency with existing code patterns

## Error Messages

Keep error messages professional but can include references to Chiquito's style (like "fistro") for consistency with the existing codebase.

Remember: Clean code is better than commented code!
