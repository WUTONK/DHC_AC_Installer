/* tslint:disable */
/* eslint-disable */
/**
 * DHC AC Installer API
 * The version of the OpenAPI document: 2.0.0
 */

export interface PrecheckDlcResp {
    hasAllDLC: boolean;
}

export function PrecheckDlcRespFromJSON(json: any): PrecheckDlcResp {
    if (json == null) return json;
    return {
        'hasAllDLC': json['hasAllDLC'],
    };
}

export function PrecheckDlcRespToJSON(value?: PrecheckDlcResp | null): any {
    if (value == null) return value;
    return {
        'hasAllDLC': value['hasAllDLC'],
    };
}
