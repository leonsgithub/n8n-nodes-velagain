import {
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

async function loadNamedOptions(
	ctx: ILoadOptionsFunctions,
	path: string,
	nameField: string,
): Promise<INodePropertyOptions[]> {
	const credentials = await ctx.getCredentials('velagainApi');
	const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
	const items = (await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'velagainApi', {
		method: 'GET',
		url: `${baseUrl}${path}`,
		json: true,
	})) as IDataObject[];
	return (items ?? []).map((item) => ({
		name: (item[nameField] as string) ?? (item.id as string),
		value: item.id as string,
	}));
}

export class Velagain implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Velagain',
		name: 'velagain',
		icon: 'file:velagain.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create and manage Velagain bookings and customers',
		usableAsTool: true,
		defaults: {
			name: 'Velagain',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'velagainApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Booking', value: 'booking' },
					{ name: 'Customer', value: 'customer' },
				],
				default: 'booking',
			},

			// ── Booking operations ─────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['booking'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a booking',
						routing: { request: { method: 'POST', url: '/bookings' } },
					},
					{
						name: 'Cancel',
						value: 'cancel',
						action: 'Cancel a booking',
						routing: {
							request: { method: 'POST', url: '=/bookings/{{$parameter.bookingId}}/cancel' },
						},
					},
					{
						name: 'Reschedule',
						value: 'reschedule',
						action: 'Reschedule a booking',
						routing: {
							request: { method: 'PUT', url: '=/bookings/{{$parameter.bookingId}}' },
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a booking',
						routing: {
							request: { method: 'GET', url: '=/bookings/{{$parameter.bookingId}}' },
						},
					},
				],
				default: 'create',
			},

			// Booking id (cancel / reschedule / get)
			{
				displayName: 'Booking ID',
				name: 'bookingId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: { resource: ['booking'], operation: ['cancel', 'reschedule', 'get'] },
				},
			},

			// Booking: Create fields
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['booking'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'customer_id' } },
			},
			{
				displayName: 'Start Time',
				name: 'start_time',
				type: 'dateTime',
				required: true,
				default: '',
				description: 'ISO 8601 start time of the booking',
				displayOptions: { show: { resource: ['booking'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'start_time' } },
			},
			{
				displayName: 'End Time',
				name: 'end_time',
				type: 'dateTime',
				default: '',
				description: 'ISO 8601 end time (optional if a service determines the duration)',
				displayOptions: { show: { resource: ['booking'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'end_time' } },
			},
			{
				displayName: 'Service Name or ID',
				name: 'service_id',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: { loadOptionsMethod: 'getServices' },
				default: '',
				displayOptions: { show: { resource: ['booking'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'service_id' } },
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['booking'], operation: ['create'] } },
				options: [
					{
						displayName: 'Resource Name or ID',
						name: 'resource_id',
						type: 'options',
						description:
							'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
						typeOptions: { loadOptionsMethod: 'getResources' },
						default: '',
						routing: { send: { type: 'body', property: 'resource_id' } },
					},
					{
						displayName: 'Staff Name or ID',
						name: 'staff_id',
						type: 'options',
						description:
							'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
						typeOptions: { loadOptionsMethod: 'getStaff' },
						default: '',
						routing: { send: { type: 'body', property: 'staff_id' } },
					},
					{
						displayName: 'Idempotency Key',
						name: 'idempotency_key',
						type: 'string',
						default: '',
						description: 'Reuse the same key to make retries safe (no duplicate booking)',
						routing: { send: { type: 'body', property: 'idempotency_key' } },
					},
				],
			},

			// Booking: Reschedule fields
			{
				displayName: 'New Start Time',
				name: 'start_time',
				type: 'dateTime',
				default: '',
				displayOptions: { show: { resource: ['booking'], operation: ['reschedule'] } },
				routing: { send: { type: 'body', property: 'start_time' } },
			},
			{
				displayName: 'New End Time',
				name: 'end_time',
				type: 'dateTime',
				default: '',
				displayOptions: { show: { resource: ['booking'], operation: ['reschedule'] } },
				routing: { send: { type: 'body', property: 'end_time' } },
			},

			// ── Customer operations ────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['customer'] } },
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a customer',
						routing: { request: { method: 'POST', url: '/customers/' } },
					},
					{
						name: 'Find',
						value: 'find',
						action: 'Find customers',
						routing: { request: { method: 'GET', url: '/customers/' } },
					},
				],
				default: 'create',
			},
			{
				displayName: 'Display Name',
				name: 'display_name',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['customer'], operation: ['create'] } },
				routing: { send: { type: 'body', property: 'display_name' } },
			},
			{
				displayName: 'Additional Fields',
				name: 'customerFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['customer'], operation: ['create'] } },
				options: [
					{
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
						routing: { send: { type: 'body', property: 'phone' } },
					},
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
						routing: { send: { type: 'body', property: 'email' } },
					},
				],
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Search customers by name, phone, or email',
				displayOptions: { show: { resource: ['customer'], operation: ['find'] } },
				routing: { send: { type: 'query', property: 'search' } },
			},
		],
	};

	methods = {
		loadOptions: {
			async getServices(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return loadNamedOptions(this, '/services/', 'name');
			},
			async getResources(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return loadNamedOptions(this, '/resources/', 'name');
			},
			async getStaff(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return loadNamedOptions(this, '/staff/members', 'display_name');
			},
		},
	};
}
