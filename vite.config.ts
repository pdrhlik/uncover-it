// vite.config.js / vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default {
	plugins: [
		VitePWA({
			manifest: {
				"theme_color": "#f69435",
				"background_color": "#f69435",
				"display": "standalone",
				"scope": "/",
				"start_url": "/",
				"short_name": "vite test",
				"description": "testing vite pwa",
				"name": "vite test"
			}
		})
	]
}
