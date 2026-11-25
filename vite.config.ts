import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
// base './' makes the build work from any path, including https://<user>.github.io/<repo>/
export default defineConfig({ base: './', plugins: [svelte()], server: { port: 5173, strictPort: true }, build: { sourcemap: true } });
