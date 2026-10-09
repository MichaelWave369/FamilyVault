# FamilyVault | GitHub Pages showcase

This folder contains a **public-only React/Vite preview** for [FamilyVault](https://github.com/MichaelWave369/FamilyVault). It is separate from the real authenticated React application (web/) and FastAPI backend (backend/).

**Public preview:** https://michaelwave369.github.io/FamilyVault/ after deployment.

The showcase includes a sample household dashboard, calendar, chore board, shopping list, roles, expenses, and protected-area explanations. All demo content is fictional. Interactive changes only exist in component memory and disappear on refresh, with no API calls, sign-in, storage, file uploads, or persistent data.

**Never place real family records, medical files, vault items, credentials, or environment secrets on GitHub Pages.** It is a public static host, not an authenticated data service.

## Local development

1. Open a terminal in the showcase folder.
2. Run npm install.
3. Run npm run dev.
4. Open the Vite local URL printed in the terminal.

The Vite base URL is set to /FamilyVault/ to support project GitHub Pages hosting.

## Publish

1. Merge the pull request adding this folder and workflow.
2. In repository Settings → Pages → Build and deployment → Source, choose **GitHub Actions**.
3. In Actions, run the **FamilyVault GitHub Pages** workflow manually if a deploy has not started.
4. After success, visit https://michaelwave369.github.io/FamilyVault/.

Pull requests run the build without deployment. Default-branch pushes and manually dispatched runs build and deploy.

## Security boundary

The self-hosted FamilyVault backend supports authenticated sessions, roles, and server-side encryption. It is **not end-to-end encrypted** and must complete the production and security checklist before real sensitive data is stored. See SECURITY.md and README.md at repository root.

The Pages site does not connect to that backend and cannot view, save, or sync actual family information.
