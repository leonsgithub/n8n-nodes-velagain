import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class VelagainApi implements ICredentialType {
	name = 'velagainApi';

	displayName = 'Velagain API';

	documentationUrl = 'https://velagain.com/docs/api';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.velagain.com/api/v1',
			description:
				'Root of the Velagain API. Override this if you self-host or point at staging.',
			placeholder: 'https://api.velagain.com/api/v1',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'A Velagain API key (created under Settings → API Keys in the customer portal). Sent as the X-API-Key header.',
		},
	];

	// Injects X-API-Key on every request made with these credentials.
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	// The "Test" button in n8n calls the authenticated identity endpoint.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/auth/whoami',
		},
	};
}
