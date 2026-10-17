# CivicShield AI

CivicShield AI is a React + TypeScript + Vite civic incident reporting and road-safety demonstration app. It uses Leaflet/OpenStreetMap for map views.

## Run locally

Requirements: Node.js 22 or later.

```bash
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Deploy to GitHub Pages

1. Create a GitHub repository (for example, `civicshield-ai`).
2. Extract this ZIP on your computer. Open the extracted project folder.
3. Upload the **contents of this folder** to the repository root, including `.github/workflows/deploy.yml`. Do not upload only the ZIP file.
4. Commit the files to the `main` branch.
5. In GitHub, open **Settings → Pages**. Under **Build and deployment**, choose **GitHub Actions** as the source.
6. Open the **Actions** tab and wait for **Deploy CivicShield AI to GitHub Pages** to finish successfully.
7. Open **Settings → Pages** to find the published URL. For a project repository it will usually look like `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

The Vite configuration automatically uses the repository name as the base path during the GitHub Actions build.

## Important deployment limitations

- GitHub Pages hosts static frontend files only. This app's browser-side demonstration data/local storage does not automatically sync between users or devices. Shared incident data requires a backend/database.
- Do not place private API keys in frontend source files or commit a real `.env` file. `.env.example` is only a template.
- OpenStreetMap tiles/geocoding depend on external services and their usage policies; they require an internet connection.
- Camera and geolocation require browser permission and a secure context (HTTPS or localhost).
- The road scanner's simulator and genuine camera/model inference are different capabilities. Only claim live AI detection if the actual model is configured and running.

## Available scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```
