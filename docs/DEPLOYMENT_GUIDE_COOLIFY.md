# Deployment Guide: React Dashboard on Coolify

This guide details how to deploy the **Karunia React Dashboard** application to a **Coolify** instance using the provided `Dockerfile` and `nginx.conf`.

## Prerequisites

*   Access to a Coolify instance.
*   The project pushed to a Git repository (GitHub/GitLab) accessible by Coolify.
*   The `Dockerfile` and `nginx.conf` present in the root of the repository.

## Step-by-Step Deployment

### 1. Create a New Resource
1.  Log in to your Coolify dashboard.
2.  Navigate to your project environment.
3.  Click **"+ New"** -> **"Application"** -> **"From Public Repository"** (or Private if configured).
4.  Paste your repository URL: `https://github.com/borist-nababan-cloud/karunia-react-dashboard.git`
5.  Select the **"main"** branch.

### 2. Configuration
Coolify effectively detects Dockerfiles, but ensure the settings are correct:

1.  **Build Pack**: Select **Docker Application** (since we provided a specific `Dockerfile`).
2.  **Dockerfile Location**: Ensure it is set to `/Dockerfile`.
3.  **Port Mapping**:
    *   **Ports Exposes**: `80` (Internal port used by Nginx).
    *   Coolify will automatically assign an external domain or port if you configured the proxy.

### 3. Environment Variables
React (Vite) applications bake environment variables starting with `VITE_` into the static code **at build time**.

You **MUST** define these variables in the **secrets/environment variables** section of your Coolify application resource **Config** page for the build to pick them up correctly.

Add the following (copy from your local `.env`):

```env
VITE_APP_NAME=Daihatsu Karunia Motor
VITE_APP_VERSION=1.0.0
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY_HERE
VITE_STRAPI_URL=https://karuniastrapi.nababancloud.com/api
VITE_STRAPI_API_TOKEN=YOUR_STRAPI_TOKEN_HERE
```

> **Important**: After adding these variables, you must toggle the "Build Variable" option if available, or simply ensure they are present before clicking "Deploy".

### 4. Deploy
1.  Click **"Deploy"** in the top right corner.
2.  Watch the "Build Logs".
    *   Stage 1 will install dependencies and run `npm run build`.
    *   Stage 2 will set up Nginx and copy the files.
3.  Once the status changes to **"Running"**, click the provided link to access your application.

## Troubleshooting

### "404 Not Found" on Refresh
If you refresh a page (e.g., `/dashboard/sales-monitoring`) and get a 404 error:
*   **Cause**: Nginx is looking for a file named `page` instead of letting React handle the route.
*   **Fix**: Ensure `nginx.conf` is correctly copied and used. The provided configuration includes:
    ```nginx
    location / {
        try_files $uri $uri/ /index.html;
    }
    ```
    This tells Nginx to fallback to `index.html` for any unknown paths.

### "Enviroment Variables Missing"
If the app loads but maps or API calls fail:
*   **Cause**: `VITE_` variables were missing during the **build** phase.
*   **Fix**: Check your Coolify Environment Variables. Ensure they are correct, then **Re-deploy** (trigger a new build) to bake them in.

### "Google Maps Warning"
*   You may see a warning about async loading in the console if explicit `loading=async` was removed or configured differently, but the app should still function.
