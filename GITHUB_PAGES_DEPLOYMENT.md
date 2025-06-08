# GitHub Pages Deployment

This document explains how the pronunciation analysis app is deployed to GitHub Pages and the limitations this imposes.

## 🚀 Deployment Process

The application is automatically deployed to GitHub Pages when changes are pushed to the `main` branch using GitHub Actions.

### Workflow Overview

1. **Test Phase**: Runs linting and ensures code quality
2. **Build Phase**:
   - Builds the Next.js application for static export
   - Creates the `out` directory with static files
   - Uploads artifacts to GitHub Pages
3. **Deploy Phase**: Deploys the static files to GitHub Pages

## ⚠️ Limitations with GitHub Pages

Since GitHub Pages only serves static files, the following limitations apply:

### API Routes Not Supported

- The original API routes (`/api/pronunciation-assessment` and `/api/ai-analysis`) don't work on GitHub Pages
- These routes require server-side execution which GitHub Pages doesn't support

### Alternative Solutions

#### For Pronunciation Assessment:

1. **Azure Speech SDK Web**: Use the browser-compatible Azure Speech SDK directly in the frontend
2. **CORS-enabled Azure Speech Service**: Configure Azure to allow direct browser requests
3. **External Backend**: Deploy the API routes to a service like Vercel, Netlify Functions, or Azure Functions

#### For AI Analysis:

1. **Client-side API calls**: Use CORS-enabled AI services
2. **Serverless Functions**: Deploy to services that support server-side execution
3. **Static Fallback**: Show pre-generated suggestions or tips

## 🔧 Current Configuration

The application is configured for static export with:

```javascript
// next.config.js
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};
```

## 📝 Recommended Next Steps

To make the application fully functional:

1. **Option A**: Move to Vercel or Netlify for full-stack support
2. **Option B**: Implement client-side Azure Speech SDK integration
3. **Option C**: Create a hybrid approach with external API endpoints

## 🌐 Live URL

The application is deployed at: `https://[username].github.io/pronunciation_analysis_demo/`

## 🛠️ Development vs Production

- **Development**: Full functionality with API routes
- **GitHub Pages**: Static UI only, API features disabled

This allows for showcasing the UI/UX while maintaining the option to deploy the full application elsewhere.
