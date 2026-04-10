/* tslint:disable */
/* eslint-disable */
/**
 * DHC AC Installer API
 * The version of the OpenAPI document: 2.0.0
 */

export interface ServerDisclaimerState {
    shownCount: number;
    devForceShowSuppressed: boolean;
}

export function ServerDisclaimerStateFromJSON(json: any): ServerDisclaimerState {
    if (json == null) return json;
    return {
        'shownCount': json['shownCount'],
        'devForceShowSuppressed': json['devForceShowSuppressed'],
    };
}

export function ServerDisclaimerStateToJSON(value?: ServerDisclaimerState | null): any {
    if (value == null) return value;
    return {
        'shownCount': value['shownCount'],
        'devForceShowSuppressed': value['devForceShowSuppressed'],
    };
}
