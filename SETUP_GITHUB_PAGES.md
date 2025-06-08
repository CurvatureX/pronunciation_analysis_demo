# Setting Up GitHub Pages

To enable GitHub Pages deployment for this repository, follow these steps:

## 1. Enable GitHub Pages in Repository Settings

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. Save the settings

## 2. Verify Workflow Permissions

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**
4. Save

## 3. Trigger Deployment

Once the above settings are configured:

1. Push changes to the `main` branch
2. The GitHub Actions workflow will automatically run
3. Your site will be available at: `https://[your-username].github.io/pronunciation_analysis_demo/`

## 4. Monitor Deployment

- Go to **Actions** tab to see workflow progress
- Check **Settings** → **Pages** to see the live URL
- Deployments typically take 2-5 minutes

## 🎉 That's it!

Your pronunciation analysis app will now be automatically deployed to GitHub Pages on every push to the main branch.
