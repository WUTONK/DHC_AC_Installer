/* tslint:disable */
/* eslint-disable */
/**
 * DHC AC Installer API
 * The version of the OpenAPI document: 2.0.0
 */

export interface PrecheckCmResp {
    cmInstalled: boolean;
}

export function PrecheckCmRespFromJSON(json: any): PrecheckCmResp {
    if (json == null) return json;
    return {
        'cmInstalled': json['cmInstalled'],
    };
}

export function PrecheckCmRespToJSON(value?: PrecheckCmResp | null): any {
    if (value == null) return value;
    return {
        'cmInstalled': value['cmInstalled'],
    };
}
