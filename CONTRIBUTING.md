# Contributing to RedpillAI

We love your input! We want to make contributing to RedpillAI as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## We Develop with GitHub

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## We Use [GitHub Flow](https://guides.github.com/introduction/flow/index.html)

Pull requests are the best way to propose changes to the codebase (we use [GitHub Flow](https://guides.github.com/introduction/flow/index.html)). We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issues](https://github.com/Marvin-Cypher/RedpillAI/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/Marvin-Cypher/RedpillAI/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

People *love* thorough bug reports. I'm not even kidding.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- PostgreSQL (optional, SQLite works for development)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Marvin-Cypher/RedpillAI.git
   cd RedpillAI
   ```

2. **Environment Setup**
   
   Create `.env.local` in the frontend directory:
   ```env
   REDPILL_AI_API_KEY=your_redpill_ai_key
   COINGECKO_API_KEY=your_coingecko_key
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

   Create `.env` in the backend directory:
   ```env
   DATABASE_URL=postgresql://user:password@localhost/redpillai
   REDPILL_AI_API_KEY=your_redpill_ai_key
   COINGECKO_API_KEY=your_coingecko_key
   ```

3. **Install Dependencies**
   
   Frontend:
   ```bash
   cd frontend
   npm install
   ```

   Backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Start Development Servers**
   
   Backend:
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```

   Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Code Style

### Frontend (TypeScript/React)

- Use TypeScript for all new code
- Follow the existing component structure in `src/components/`
- Use Tailwind CSS for styling
- Follow React hooks best practices
- Use descriptive variable and function names

### Backend (Python/FastAPI)

- Follow PEP 8 style guide
- Use type hints for all function parameters and return values
- Write docstrings for all public functions and classes
- Use SQLModel for database models
- Follow FastAPI best practices for API routes

### General Guidelines

- Write meaningful commit messages
- Keep pull requests focused and small
- Update documentation when adding new features
- Add tests for new functionality
- Ensure all tests pass before submitting

## Areas Where We Need Help

### High Priority

1. **Authentication & Authorization**
   - User registration and login
   - Role-based access control
   - API key management

2. **Database Integration**
   - Complete backend API endpoints
   - Database migrations
   - Data persistence for projects and conversations

3. **File Upload & Storage**
   - Real file upload functionality
   - Document processing pipeline
   - Cloud storage integration

### Medium Priority

1. **Testing**
   - Unit tests for backend API
   - Frontend component tests
   - End-to-end testing

2. **Performance Optimization**
   - Database query optimization
   - Frontend bundle optimization
   - Caching strategies

3. **Mobile Responsiveness**
   - Mobile-first design improvements
   - Touch-friendly interactions
   - Progressive Web App features

### Low Priority

1. **Documentation**
   - API documentation improvements
   - User guide creation
   - Video tutorials

2. **Integrations**
   - Additional data sources
   - Export functionality
   - Webhook support

## AI Integration Guidelines

When working with AI features:

1. **Model Selection**: Default to DeepSeek R1 for reasoning tasks, GPT-4 for general chat
2. **Error Handling**: Always implement fallback responses for AI failures
3. **Context Management**: Keep conversation context under token limits
4. **Privacy**: Never log sensitive information in AI requests
5. **Rate Limiting**: Implement proper rate limiting for API calls

## Pull Request Process

1. **Before Submitting**
   - Ensure your code follows the style guidelines
   - Run all tests and make sure they pass
   - Update documentation if needed
   - Test your changes thoroughly

2. **PR Description**
   - Clearly describe what your PR does
   - Link to relevant issues
   - Include screenshots for UI changes
   - List any breaking changes

3. **Review Process**
   - PRs require at least one approval
   - Address all review comments
   - Keep your branch up to date with main

## Getting Help

- **Discord**: [Join our Discord server](https://discord.gg/redpillai) (coming soon)
- **GitHub Discussions**: [Ask questions](https://github.com/Marvin-Cypher/RedpillAI/discussions)
- **Issues**: [Report bugs or request features](https://github.com/Marvin-Cypher/RedpillAI/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in our README and release notes. Significant contributors may be invited to join the core team.

Thank you for contributing to RedpillAI! 🚀