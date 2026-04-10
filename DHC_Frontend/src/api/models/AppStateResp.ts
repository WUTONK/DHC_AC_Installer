/* tslint:disable */
/* eslint-disable */
/**
 * DHC AC Installer API
 * The version of the OpenAPI document: 2.0.0
 */

import type { ServerDisclaimerState } from './ServerDisclaimerState';
import { ServerDisclaimerStateFromJSON } from './ServerDisclaimerState';

export interface AppStateResp {
    firstLaunchCompleted: boolean;
    serverDisclaimer: ServerDisclaimerState;
}

export function AppStateRespFromJSON(json: any): AppStateResp {
    if (json == null) return json;
    return {
        'firstLaunchCompleted': json['firstLaunchCompleted'],
        'serverDisclaimer': ServerDisclaimerStateFromJSON(json['serverDisclaimer']),
    };
}

export function AppStateRespToJSON(value?: AppStateResp | null): any {
    if (value == null) return value;
    return {
        'firstLaunchCompleted': value['firstLaunchCompleted'],
        'serverDisclaimer': value['serverDisclaimer'],
    };
}
