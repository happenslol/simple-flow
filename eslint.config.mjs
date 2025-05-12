import js from "@eslint/js"
import ts from "typescript-eslint"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import reactRefreshPlugin from "eslint-plugin-react-refresh"
import unusedImportsPlugin from "eslint-plugin-unused-imports"
import reactPlugin from "eslint-plugin-react"
import globals from "globals"

export default ts.config(
	{ ignores: ["dist"] },
	js.configs.recommended,
	...ts.configs.recommended,
	{
		languageOptions: {
			parserOptions: { warnOnUnsupportedTypeScriptVersion: false },
		},
		plugins: { "unused-imports": unusedImportsPlugin },
		rules: {
			"no-empty": ["error", { allowEmptyCatch: true }],
			"func-style": "error",
			"arrow-body-style": ["error", "as-needed"],

			"no-mixed-spaces-and-tabs": "off",
			"@typescript-eslint/no-explicit-any": "off",

			// Use eslint-plugin-unused-imports instead
			"@typescript-eslint/no-unused-vars": "off",

			"unused-imports/no-unused-imports": "error",
			"unused-imports/no-unused-vars": [
				"warn",
				{
					vars: "all",
					varsIgnorePattern: "^_",
					args: "after-used",
					argsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
		},
	},
	{
		files: ["src/**/*.ts", "src/**/*.tsx"],
		languageOptions: { globals: globals.browser },
		plugins: {
			"react-hooks": reactHooksPlugin,
			"react-refresh": reactRefreshPlugin,
			react: reactPlugin,
		},
		rules: {
			...reactHooksPlugin.configs.recommended.rules,

			"react/jsx-uses-react": "error",
			"react/jsx-uses-vars": "error",

			"react-refresh/only-export-components": [
				"warn",
				{ allowConstantExport: true },
			],
		},
	},
)
