/* tslint:disable */
/* eslint-disable */
/**
 * LW RAG API
 * RAGシステムのAPI
 *
 * The version of the OpenAPI document: 0.1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import type {
  CorporaCreate,
  HTTPValidationError,
} from '../models';
import {
    CorporaCreateFromJSON,
    CorporaCreateToJSON,
    HTTPValidationErrorFromJSON,
    HTTPValidationErrorToJSON,
} from '../models';

export interface CreateCorporaCorporaPostRequest {
    corporaCreate: CorporaCreate;
}

/**
 * CorporaApi - interface
 * 
 * @export
 * @interface CorporaApiInterface
 */
export interface CorporaApiInterface {
    /**
     * コーパスを作成。  Args:     corpora: 作成するコーパスの情報     csrf_token: CSRFトークン（セキュリティチェックに使用）  Returns:     dict: 作成されたコーパスの情報
     * @summary Create Corpora
     * @param {CorporaCreate} corporaCreate 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof CorporaApiInterface
     */
    createCorporaCorporaPostRaw(requestParameters: CreateCorporaCorporaPostRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<any>>;

    /**
     * コーパスを作成。  Args:     corpora: 作成するコーパスの情報     csrf_token: CSRFトークン（セキュリティチェックに使用）  Returns:     dict: 作成されたコーパスの情報
     * Create Corpora
     */
    createCorporaCorporaPost(requestParameters: CreateCorporaCorporaPostRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<any>;

}

/**
 * 
 */
export class CorporaApi extends runtime.BaseAPI implements CorporaApiInterface {

    /**
     * コーパスを作成。  Args:     corpora: 作成するコーパスの情報     csrf_token: CSRFトークン（セキュリティチェックに使用）  Returns:     dict: 作成されたコーパスの情報
     * Create Corpora
     */
    async createCorporaCorporaPostRaw(requestParameters: CreateCorporaCorporaPostRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<any>> {
        if (requestParameters.corporaCreate === null || requestParameters.corporaCreate === undefined) {
            throw new runtime.RequiredError('corporaCreate','Required parameter requestParameters.corporaCreate was null or undefined when calling createCorporaCorporaPost.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["X-CSRF-Token"] = this.configuration.apiKey("X-CSRF-Token"); // APIKeyHeader authentication
        }

        const response = await this.request({
            path: `/corpora/`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: CorporaCreateToJSON(requestParameters.corporaCreate),
        }, initOverrides);

        return new runtime.TextApiResponse(response) as any;
    }

    /**
     * コーパスを作成。  Args:     corpora: 作成するコーパスの情報     csrf_token: CSRFトークン（セキュリティチェックに使用）  Returns:     dict: 作成されたコーパスの情報
     * Create Corpora
     */
    async createCorporaCorporaPost(requestParameters: CreateCorporaCorporaPostRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<any> {
        const response = await this.createCorporaCorporaPostRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
