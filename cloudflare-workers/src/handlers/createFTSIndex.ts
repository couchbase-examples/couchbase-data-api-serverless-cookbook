import { Context } from 'hono';
import { Env } from '../types/env';
import { getAuthHeaders, getFTSIndexUrl } from '../utils/couchbase';

export const createFTSIndex = async (c: Context<{ Bindings: Env }>) => {
	try {
		const indexName = 'hotel-geo-index';
		const url = getFTSIndexUrl(c.env, indexName);

		// FTS index definition with geo-spatial mapping for scoped collections
		const indexDefinition = {
			"type": "fulltext-index",
			"name": indexName,
			"sourceType": "gocbcore",
			"sourceName": "travel-sample",
			"sourceParams": {},
			"planParams": {
				"maxPartitionsPerPIndex": 1024,
				"indexPartitions": 1
			},
			"params": {
				"doc_config": {
					"docid_prefix_delim": "",
					"docid_regexp": "",
					"mode": "scope.collection.type_field",
					"type_field": "type"
				},
				"mapping": {
					"analysis": {},
					"default_analyzer": "standard",
					"default_datetime_parser": "dateTimeOptional",
					"default_field": "_all",
					"default_mapping": {
						"dynamic": true,
						"enabled": false
					},
					"default_type": "_default",
					"docvalues_dynamic": false,
					"index_dynamic": true,
					"store_dynamic": false,
					"type_field": "_type",
					"types": {
						"inventory.hotel": {
							"dynamic": true,
							"enabled": true,
							"properties": {
								"geo": {
									"dynamic": false,
									"enabled": true,
									"fields": [
										{
											"analyzer": "keyword",
											"include_in_all": true,
											"include_term_vectors": true,
											"index": true,
											"name": "geo",
											"store": true,
											"type": "geopoint"
										}
									]
								},
								"name": {
									"dynamic": false,
									"enabled": true,
									"fields": [
										{
											"analyzer": "standard",
											"include_in_all": true,
											"include_term_vectors": true,
											"index": true,
											"name": "name",
											"store": true,
											"type": "text"
										}
									]
								},
								"city": {
									"dynamic": false,
									"enabled": true,
									"fields": [
										{
											"analyzer": "standard",
											"include_in_all": true,
											"include_term_vectors": true,
											"index": true,
											"name": "city",
											"store": true,
											"type": "text"
										}
									]
								}
							}
						}
					}
				},
				"store": {
					"indexType": "scorch",
					"segmentVersion": 15
				}
			}
		};

		console.log(`Creating FTS index at: ${url}`);
		console.log(`Index definition:`, JSON.stringify(indexDefinition, null, 2));

		const response = await fetch(url, {
			method: 'PUT',
			headers: getAuthHeaders(c.env),
			body: JSON.stringify(indexDefinition)
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`FTS Index Creation Error (${response.status}): ${errorBody}`);
			return new Response(
				JSON.stringify({ 
					error: `Error creating FTS index: ${response.statusText}`,
					detail: errorBody
				}),
				{ status: response.status, headers: { 'Content-Type': 'application/json' } }
			);
		}

		const result = await response.json();

		return new Response(
			JSON.stringify({
				message: `FTS index '${indexName}' created successfully`,
				index_name: indexName,
				status: "created",
				details: result,
				next_step: "The index is being built. Use POST /airports/hotels/nearby to search for hotels once ready."
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);

	} catch (error: any) {
		console.error("Error creating FTS index:", error);
		return new Response(
			JSON.stringify({ 
				error: error.message
			}),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
}; 