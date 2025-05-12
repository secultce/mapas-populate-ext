// MapasSDK - Browser-compatible version
// Note: Requires jwt-decode library for JWT decoding
class MapasSDK {
    constructor(instanceUrl, pubKey = null, priKey = null, algo = 'HS512') {
        this._mapasInstanceUrl = instanceUrl;
        this._pubKey = pubKey;
        this._priKey = priKey;
        this._algo = algo;

        // Default curl-like options
        this.defaultOptions = {
            // In browser, SSL verification is typically handled by the browser
            credentials: 'include'
        };

        // Debug flags
        this.debugRequest = false;
        this.debugResponse = false;

        // Patterns for potential caching
        this.cachePatterns = [
            'api/[^/]+/describe',
            'api/[^/]+/getTypes'
        ];
    }

    // Helper functions to mimic PHP functions
    static EQ(value) {
        return `EQ(${value})`;
    }

    static IN(values) {
        return `IN(${values.join(',')})`;
    }

    // JWT generation (simplified for browser)
    _getJWT() {
        if (!this._pubKey || !this._priKey) {
            return null;
        }

        // Note: In browser, you'll need to use a JWT library like jwt-decode
        // This is a simplified mock - actual implementation depends on your JWT library
        return btoa(JSON.stringify({
            tm: Date.now().toString(),
            pk: this._pubKey
        }));
    }

    // Debug request method
    _debugRequest(method, targetPath, data, headers, options) {
        if (this.debugRequest) {
            console.log(`------------=======================MapasSDK=========================------------`);
            console.log(`${method.toUpperCase()} ${targetPath}`);

            const debug = {};
            if (headers) debug.headers = headers;
            if (options) debug.options = options;
            if (data) debug.data = data;

            if (Object.keys(debug).length) {
                console.log(debug);
            }
        }
    }

    // Debug response method
    _debugResponse(response) {
        if (this.debugResponse) {
            console.log('\n\nRESPONSE:\n', response);
            console.log('================================================================================\n');
        }
    }

    // Core API request method
    async apiRequest(method, targetPath, data = {}, headers = {}, options = {}) {
        // Merge default options with provided options
        const fetchOptions = {
            ...this.defaultOptions,
            ...options,
            method: method.toUpperCase(),
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            }
        };

        // Add JWT if keys are present
        if (this._pubKey && this._priKey) {
            fetchOptions.headers['authorization'] = this._getJWT();
            fetchOptions.headers['MapasSDK-REQUEST'] = 'true';
        }

        // Add body for methods that support it
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
            fetchOptions.body = JSON.stringify(data);
        }

        // Debug request
        this._debugRequest(method, targetPath, data, fetchOptions.headers, options);

        try {
            const url = `${this._mapasInstanceUrl}${targetPath}`;
            const response = await fetch(url, fetchOptions);

            // Debug response
            if (this.debugResponse) {
                this._debugResponse(response);
            }

            // Handle HTTP errors
            if (!response.ok) {
                switch (response.status) {
                    case 400: throw new Error('Bad Request');
                    case 401: throw new Error('Unauthorized');
                    case 403: throw new Error('Forbidden');
                    case 404: throw new Error('Not Found');
                    default: throw new Error('Unexpected Error');
                }
            }

            // Parse JSON response
            const responseData = await response.json();
            return responseData;

        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Convenience methods for different HTTP methods
    apiGet(targetPath, data = {}, headers = {}, options = {}) {
        // Convert data to query parameters for GET requests
        let queryString = '';
        new URLSearchParams(data).forEach((value, param) => {
          queryString += `&${param}=${value}`;
        });

        const fullPath = queryString ? `${targetPath}?${queryString}` : targetPath;
        return this.apiRequest('GET', fullPath, {}, headers, options);
    }

    apiPost(targetPath, data = {}, headers = {}, options = {}) {
        return this.apiRequest('POST', targetPath, data, headers, options);
    }

    apiPut(targetPath, data = {}, headers = {}, options = {}) {
        return this.apiRequest('PUT', targetPath, data, headers, options);
    }

    apiPatch(targetPath, data = {}, headers = {}, options = {}) {
        return this.apiRequest('PATCH', targetPath, data, headers, options);
    }

    apiDelete(targetPath, data = {}, headers = {}, options = {}) {
        return this.apiRequest('DELETE', targetPath, data, headers, options);
    }

    // Entity creation
    async createEntity(type, data) {
        const response = await this.apiPost(`${type}/index`, data);

        if (response.error) {
            throw new Error('Validation Error: ' + JSON.stringify(response.error));
        }

        return response;
    }

    // Entity update (full update)
    async updateEntity(type, id, data) {
        const response = await this.apiPut(`${type}/single/${id}`, data);

        if (response.error) {
            throw new Error('Validation Error: ' + JSON.stringify(response.error));
        }

        return response;
    }

    // Entity partial update
    async patchEntity(type, id, data) {
        const response = await this.apiPatch(`${type}/single/${id}`, data);

        if (response.error) {
            throw new Error('Validation Error: ' + JSON.stringify(response.error));
        }

        return response;
    }

    // Entity deletion
    async deleteEntity(type, id) {
        await this.apiDelete(`${type}/single/${id}`);
        return true;
    }

    // Get entity description
    async getEntityDescription(type) {
        return this.apiGet(`api/${type}/describe`);
    }

    // Get entity types
    async getEntityTypes(type) {
        return this.apiGet(`api/${type}/getTypes`);
    }

    // Find specific entity
    async findEntity(type, id, fields) {
        const fieldString = Array.isArray(fields) ? fields.join(',') : fields;
        return this.apiGet(`api/${type}/findOne`, {
            id: MapasSDK.EQ(id),
            '@select': fieldString
        });
    }

    // Find multiple entities
    async findEntities(type, fields, params = {}) {
        const fieldString = Array.isArray(fields) ? fields.join(',') : fields;
        return this.apiGet(`api/${type}/find`, {
            ...params,
            '@select': fieldString
        });
    }

    // Find spaces by events
    async findSpacesByEvents(from, to, fields, params = {}) {
        return this.apiGet('api/space/findByEvents', {
            ...params,
            '@select': Array.isArray(fields) ? fields.join(',') : fields,
            '@from': from,
            '@to': to
        });
    }

    // Find event occurrences
    async findEventOccurrences(from, to, params = {}) {
        return this.apiGet('api/event/findOccurrences', {
            ...params,
            '@from': from,
            '@to': to
        });
    }

    // Get taxonomy terms
    async getTaxonomyTerms(taxonomySlug) {
        return this.apiGet(`/api/term/list/${taxonomySlug}`);
    }

    // File upload (simplified for browser - requires FormData)
    async uploadFile(type, id, filegroup, file) {
        const formData = new FormData();
        formData.append(filegroup, file);

        const response = await fetch(
            `${this._mapasInstanceUrl}${type}/upload/id:${id}/`,
            {
                method: 'POST',
                body: formData,
                headers: {
                    'authorization': this._getJWT(),
                    'MapasSDK-REQUEST': '1'
                }
            }
        );

        return response.json();
    }
}

// Export for use in modules or global scope
export default MapasSDK;
