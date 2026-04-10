/* tslint:disable */
/* eslint-disable */
/**
 * DHC AC Installer API
 * The version of the OpenAPI document: 2.0.0
 */

export interface PrecheckResourcesResp {
    imported: boolean;
    complete: boolean;
}

export function PrecheckResourcesRespFromJSON(json: any): PrecheckResourcesResp {
    if (json == null) return json;
    return {
        'imported': json['imported'],
        'complete': json['complete'],
    };
}

export function PrecheckResourcesRespToJSON(value?: PrecheckResourcesResp | null): any {
    if (value == null) return value;
    return {
        'imported': value['imported'],
        'complete': value['complete'],
    };
}
