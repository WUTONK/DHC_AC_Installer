/* tslint:disable */
/* eslint-disable */
/**
 * DHC AC Installer API
 * The version of the OpenAPI document: 2.0.0
 */

export interface UpsertServerDisclaimerReq {
    shownCount: number;
    devForceShowSuppressed: boolean;
}

export function UpsertServerDisclaimerReqFromJSON(json: any): UpsertServerDisclaimerReq {
    if (json == null) return json;
    return {
        'shownCount': json['shownCount'],
        'devForceShowSuppressed': json['devForceShowSuppressed'],
    };
}

export function UpsertServerDisclaimerReqToJSON(value?: UpsertServerDisclaimerReq | null): any {
    if (value == null) return value;
    return {
        'shownCount': value['shownCount'],
        'devForceShowSuppressed': value['devForceShowSuppressed'],
    };
}
