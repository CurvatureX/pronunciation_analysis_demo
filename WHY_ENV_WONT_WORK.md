# Why Environment Variables Don't Work with GitHub Pages

## 🔍 The Fundamental Problem

GitHub Pages serves **static files only**. This means:

1. **No Server**: No Node.js runtime to keep secrets private
2. **Client-Side Only**: All code runs in the user's browser
3. **Public Bundle**: JavaScript files are downloaded by users

## 🚨 What Happens with NEXT*PUBLIC* Variables

```javascript
// In your code:
const apiKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;

// After Next.js build:
const apiKey = "your-actual-api-key-here"; // 🚨 EXPOSED!
```

### During Build Process:

1. Next.js reads environment variables
2. Replaces `process.env.NEXT_PUBLIC_*` with actual values
3. Bundles into static JavaScript files
4. Anyone can view source and see your keys

## 🔬 How to Verify This

After deployment, anyone can:

1. **View Page Source**: Right-click → View Source
2. **DevTools**: F12 → Sources tab → Search for your API key
3. **Network Tab**: See API calls with keys in URLs/headers
4. **Download Files**: Direct access to `.js` files containing secrets

Example of exposed secret in built file:

```javascript
// In the deployed bundle.js:
fetch("/api/speech", {
  headers: {
    Authorization: "Bearer sk-your-secret-key-here", // 🚨 VISIBLE!
  },
});
```

## ✅ Secure Alternatives

### Option 1: Server-Side Hosting

```
Frontend (Browser) → Backend (Server) → External API
     ↑ Safe              ↑ Secure       ↑ API Key
   Public code         Private env     stays private
```

**Platforms that support this:**

- Vercel (recommended)
- Netlify
- Railway
- Heroku

### Option 2: Proxy Pattern

```
Frontend → Your API Server → Azure/OpenAI
           (holds secrets)
```

### Option 3: Client-Side SDK (Limited)

Some services offer browser-compatible SDKs with restricted permissions:

- Azure Speech SDK for JavaScript (with CORS setup)
- OpenAI API (with usage limits and domain restrictions)

## 🎯 Recommendations

### For Portfolio/Demo:

- ✅ Use GitHub Pages with mock data
- ✅ Show UI/UX capabilities
- ✅ Add "Demo Mode" indicator

### For Production:

- ✅ Deploy to Vercel/Netlify
- ✅ Keep API keys server-side
- ✅ Use environment variables properly

### Quick Migration:

```bash
# Deploy to Vercel (free tier)
npm install -g vercel
vercel

# Add environment variables securely
vercel env add AZURE_SPEECH_KEY
vercel env add AZURE_SPEECH_REGION
```

## 🚫 What NOT to Do

- ❌ Upload .env.local to GitHub
- ❌ Use NEXT*PUBLIC* for API keys
- ❌ Hardcode secrets in source code
- ❌ Put secrets in GitHub repository
- ❌ Commit .env files to git

## 🔒 Security Best Practices

1. **Keep .env.local in .gitignore** (it's there for a reason!)
2. **Never commit secrets to version control**
3. **Use server-side hosting for API keys**
4. **Rotate keys if accidentally exposed**
5. **Use environment-specific access controls**
