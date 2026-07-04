/**
 * ESLint config for the Velagain n8n community node.
 * Uses eslint-plugin-n8n-nodes-base to enforce the community-node contract
 * (naming, structure, credential/test conventions) checked by `npm run lint`.
 */
module.exports = {
	root: true,
	env: {
		browser: true,
		es6: true,
		node: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module',
		extraFileExtensions: ['.json'],
	},
	ignorePatterns: ['.eslintrc.js', '**/*.js', '**/node_modules/**', '**/dist/**'],
	overrides: [
		{
			files: ['package.json'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/community'],
			rules: {
				'n8n-nodes-base/community-package-json-name-still-default': 'off',
			},
		},
		{
			files: ['./credentials/**/*.ts'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/credentials'],
			parserOptions: {
				project: ['./tsconfig.json'],
			},
			rules: {
				// This rule is documented as "only applicable to nodes in the main
				// repository" and camelCases the documentationUrl, which conflicts with
				// the community-node requirement for a full https:// URL. Disable it.
				'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
			},
		},
		{
			files: ['./nodes/**/*.ts'],
			plugins: ['eslint-plugin-n8n-nodes-base'],
			extends: ['plugin:n8n-nodes-base/nodes'],
			parserOptions: {
				project: ['./tsconfig.json'],
			},
		},
	],
};
