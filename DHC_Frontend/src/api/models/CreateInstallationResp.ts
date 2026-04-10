/* tslint:disable */
/* eslint-disable */
/**
 * DHC AC Installer API
 * The version of the OpenAPI document: 2.0.0
 */

export interface CreateInstallationResp {
    id: string;
    versionId: string;
    status: string;
    startTime: number;
}

export function CreateInstallationRespFromJSON(json: any): CreateInstallationResp {
    if (json == null) return json;
    return {
        'id': json['id'],
        'versionId': json['versionId'],
        'status': json['status'],
        'startTime': json['startTime'],
    };
}

export function CreateInstallationRespToJSON(value?: CreateInstallationResp | null): any {
    if (value == null) return value;
    return {
        'id': value['id'],
        'versionId': value['versionId'],
        'status': value['status'],
        'startTime': value['startTime'],
    };
}
