# Vercel CI/CD Setup Guide

## Required GitHub Secrets

Add these secrets in GitHub repository settings → Secrets and variables → Actions:

### Vercel Deployment

| Secret Name | Value | Where to Find |
|-------------|-------|---------------|
| `VERCEL_TOKEN` | Vercel access token | [Vercel Dashboard](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Organization ID | `vercel org ls` or project settings |
| `VERCEL_PROJECT_ID` | Project ID | `vercel project ls` or project settings |

### API Keys (for server deployment)

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `ANTHROPIC_API_KEY` | sk-antic03-... | Anthropic Claude API key |
| `GEMINI_API_KEY` | AIza... | Google Gemini API key |
| `REDIS_URL` | redis://... | Redis connection string (optional) |

### Setup Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Get org and project IDs
vercel org ls
vercel project ls
```

## GitHub Actions Workflow

The CI/CD pipeline is configured in `.github/workflows/ci.yml`:

1. **lint-and-typecheck** - Runs ESLint and TypeScript check
2. **test** - Runs Vitest unit tests
3. **build** - Builds client and server
4. **e2e-test** - Runs Playwright E2E tests
5. **deploy-preview** - Deploys to Vercel preview (on develop)
6. **deploy-production** - Deploys to Vercel production (on main)
7. **server-deploy** - Deploys server via SSH

## Environment Variables

Create `.env.example` in the server directory:

```bash
# Required for AI features
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key

# Optional - Redis for caching and rate limiting
REDIS_URL=redis://localhost:6379

# CORS origins
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.vercel.app

# Server port
PORT=3000
```

## Deployment Verification

After setting up secrets, trigger a deployment:

```bash
# Push to develop branch for preview
git checkout -b develop
git add .
git commit -m "Setup CI/CD"
git push origin develop

# Push to main for production
git checkout main
git merge develop
git push origin main
```

## Troubleshooting

### Deployment fails with "not found vercel"
- Run `vercel link` locally to link the project
- Copy the org and project IDs to GitHub secrets

### Tests fail
- Ensure all dependencies are installed: `bun install`
- Run tests locally: `bun run test`

### Build fails
- Check TypeScript errors: `npx tsc --noEmit`
- Ensure all environment variables are set
