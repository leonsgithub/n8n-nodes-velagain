import { createHmac, timingSafeEqual } from 'crypto';
import {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
	NodeOperationError,
} from 'n8n-workflow';

const EVENT_OPTIONS = [
	{ name: 'Booking Created', value: 'booking.created' },
	{ name: 'Booking Cancelled', value: 'booking.cancelled' },
	{ name: 'Booking Rescheduled', value: 'booking.rescheduled' },
	{ name: 'Booking Rejected', value: 'booking.rejected' },
	{ name: 'Booking Ready', value: 'booking.ready' },
	{ name: 'Booking Completed', value: 'booking.completed' },
	{ name: 'Payment Created', value: 'payment.created' },
	{ name: 'Tenant Updated', value: 'tenant.updated' },
];

export class VelagainTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Velagain Trigger',
		name: 'velagainTrigger',
		icon: 'file:velagain.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts a workflow when a Velagain event fires (via webhook subscription)',
		defaults: {
			name: 'Velagain Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'velagainApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				required: true,
				default: 'booking.created',
				options: EVENT_OPTIONS,
				description: 'The Velagain event that triggers this workflow',
			},
			{
				displayName: 'Verify Signature',
				name: 'verifySignature',
				type: 'boolean',
				default: false,
				description:
					'Whether to reject deliveries whose X-Hub-Signature HMAC does not match the shared secret',
			},
			{
				displayName: 'Signature Secret',
				name: 'signatureSecret',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'The secret the subscription was created with, used to verify X-Hub-Signature',
				displayOptions: {
					show: {
						verifySignature: [true],
					},
				},
			},
		],
	};

	webhookMethods = {
		default: {
			// Returns true if a subscription for this URL already exists (avoids duplicates).
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const credentials = await this.getCredentials('velagainApi');
				const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

				const existing = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'velagainApi',
					{
						method: 'GET',
						url: `${baseUrl}/management/webhooks`,
						json: true,
					},
				)) as IDataObject[];

				const webhookData = this.getWorkflowStaticData('node');
				for (const sub of existing) {
					if (sub.target_url === webhookUrl) {
						webhookData.webhookId = sub.id;
						return true;
					}
				}
				return false;
			},

			// Creates a webhook subscription and stores its id in node static data.
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const credentials = await this.getCredentials('velagainApi');
				const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

				const body: IDataObject = {
					target_url: webhookUrl,
					event_type: event,
				};
				const secret = this.getNodeParameter('signatureSecret', '') as string;
				if (secret) {
					body.secret = secret;
				}

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'velagainApi',
					{
						method: 'POST',
						url: `${baseUrl}/management/webhooks`,
						body,
						json: true,
					},
				)) as IDataObject;

				if (response.id === undefined) {
					return false;
				}
				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = response.id;
				return true;
			},

			// Deletes the subscription on workflow deactivation (no orphans).
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId === undefined) {
					return true;
				}
				const credentials = await this.getCredentials('velagainApi');
				const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

				try {
					await this.helpers.httpRequestWithAuthentication.call(this, 'velagainApi', {
						method: 'DELETE',
						url: `${baseUrl}/management/webhooks/${webhookData.webhookId}`,
						json: true,
					});
				} catch (error) {
					return false;
				}
				delete webhookData.webhookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const verify = this.getNodeParameter('verifySignature', false) as boolean;

		if (verify) {
			const secret = this.getNodeParameter('signatureSecret', '') as string;
			const headers = this.getHeaderData() as IDataObject;
			const signature = (headers['x-hub-signature'] as string) ?? '';
			const req = this.getRequestObject();
			// Prefer the exact bytes the server signed; fall back to a re-serialization.
			const raw =
				(req as unknown as { rawBody?: Buffer }).rawBody?.toString('utf8') ??
				JSON.stringify(bodyData);
			const expected = 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');

			const a = Buffer.from(signature);
			const b = Buffer.from(expected);
			if (a.length !== b.length || !timingSafeEqual(a, b)) {
				throw new NodeOperationError(this.getNode(), 'Webhook signature verification failed');
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(bodyData as IDataObject)],
		};
	}
}
