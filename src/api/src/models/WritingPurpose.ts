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

import { exists, mapValues } from '../runtime';
/**
 * 書き目的
 * @export
 * @interface WritingPurpose
 */
export interface WritingPurpose {
}

/**
 * Check if a given object implements the WritingPurpose interface.
 */
export function instanceOfWritingPurpose(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function WritingPurposeFromJSON(json: any): WritingPurpose {
    return WritingPurposeFromJSONTyped(json, false);
}

export function WritingPurposeFromJSONTyped(json: any, ignoreDiscriminator: boolean): WritingPurpose {
    return json;
}

export function WritingPurposeToJSON(value?: WritingPurpose | null): any {
    return value;
}

