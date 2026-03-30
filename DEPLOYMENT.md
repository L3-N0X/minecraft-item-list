# GitHub Pages Deployment Setup

This repository is configured to automatically deploy to GitHub Pages when a new version tag is pushed.

## Automatic Deployment

### How it works
- Push a tag matching the pattern `v*.*.*`, `v*.*`, or `v*` (e.g., `v1.0.0`, `v1.0`, or `v1`)
- GitHub Actions will automatically build and deploy the site to GitHub Pages
- The deployment URL will be: `https://l3-n0x.github.io/minecraft-item-list/`

### Creating a release
```bash
# Tag the current commit
git tag v1.0.0

# Push the tag to trigger deployment
git push origin v1.0.0
```

## One-Time Repository Setup

To enable GitHub Pages deployment, you need to configure the repository settings once:

### Steps:

1. **Navigate to Repository Settings**
   - Go to your repository on GitHub: `https://github.com/L3-N0X/minecraft-item-list`
   - Click on **Settings** tab

2. **Enable GitHub Pages**
   - In the left sidebar, click on **Pages** under "Code and automation"
   - Under **Build and deployment**:
     - **Source**: Select **GitHub Actions** (not "Deploy from a branch")
   
3. **Verify Permissions**
   - Go to **Settings** → **Actions** → **General**
   - Scroll down to **Workflow permissions**
   - Ensure either:
     - "Read and write permissions" is selected, OR
     - "Read repository contents and packages permissions" with "Allow GitHub Actions to create and approve pull requests" checked

4. **⚠️ CRITICAL: Configure Environment Protection Rules for Tags**
   - Go to **Settings** → **Environments**
   - Click on the **`github-pages`** environment (created after first workflow run)
   - Under **Deployment branches and tags**:
     - If it says "Selected branches", click the dropdown
     - Select **"No restriction"** (to allow deployments from tags)
     - OR add a rule: Click "Add deployment branch or tag rule" → Select "Tags" → Pattern: `v*`
   - Click **Save protection rules**
   
   **Why this is needed**: By default, GitHub Pages environments only allow deployments from branches. Since this workflow deploys on tag pushes, you must configure the environment to allow tag-based deployments.

### First Deployment

After configuring the settings above:

1. Create and push a tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. Monitor the deployment:
   - Go to the **Actions** tab in your repository
   - You'll see the "Deploy to GitHub Pages" workflow running
   - Click on it to see the build and deployment progress

3. Access your site:
   - Once deployed, visit: `https://l3-n0x.github.io/minecraft-item-list/`
   - The URL will also be shown in the deployment job output

## Troubleshooting

### "Tag is not allowed to deploy" error
**Error**: `Tag "v1.0.4" is not allowed to deploy to github-pages due to environment protection rules.`

**Cause**: The `github-pages` environment has protection rules that only allow deployments from specific branches, not tags.

**Solution**:
1. Go to `https://github.com/L3-N0X/minecraft-item-list/settings/environments`
2. Click on **`github-pages`**
3. Under **Deployment branches and tags**:
   - Change to **"No restriction"**, OR
   - Add tag rule: Click "Add deployment branch or tag rule" → Tags → Pattern: `v*`
4. Save and retry your deployment

### Deployment fails with permissions error
- Check that GitHub Pages is set to "GitHub Actions" as the source
- Verify workflow permissions in Settings → Actions → General

### Assets not loading (404 errors)
- The Vite config is set with base path `/minecraft-item-list/`
- Ensure the repository name hasn't changed
- If it has, update the `base` in `vite.config.ts`

### Build fails
- Check the Actions tab for detailed error logs
- Ensure all dependencies are listed in `package.json`
- Verify that the build works locally with `bun run build`

## Workflow Details

The workflow (`.github/workflows/deploy-pages.yml`) performs these steps:

1. **Build Job**:
   - Checks out code
   - Sets up Bun runtime
   - Installs dependencies
   - Configures GitHub Pages
   - Builds the Vite app with production settings
   - Uploads the `dist` folder as an artifact

2. **Deploy Job**:
   - Downloads the build artifact
   - Deploys to GitHub Pages
   - Provides the deployment URL

### Environment Variables

The build automatically uses `.env.production` during the build process. The production environment sets:
- `NODE_ENV=production` (via the workflow)
- `VITE_STATIC_MODE=true` (from `.env.production`)

These ensure the app is built in static mode suitable for GitHub Pages.
