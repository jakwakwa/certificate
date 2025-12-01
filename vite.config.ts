import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				alt1: resolve(__dirname, "shares-certificate-alt001.html"),
				alt2: resolve(__dirname, "shares-certificate-alt002.html"),
			},
		},
	},
});
