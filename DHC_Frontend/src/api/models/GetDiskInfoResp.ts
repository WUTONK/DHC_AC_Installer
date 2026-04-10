/* tslint:disable */
/* eslint-disable */
/**
 * DHC AC Installer API
 * The version of the OpenAPI document: 2.0.0
 */

export interface GetDiskInfoResp {
    drive: string;
    label?: string;
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    isSSD?: boolean;
    isRemovable?: boolean;
}

export function GetDiskInfoRespFromJSON(json: any): GetDiskInfoResp {
    if (json == null) return json;
    return {
        'drive': json['Drive'],
        'label': json['Label'],
        'totalBytes': json['TotalBytes'],
        'usedBytes': json['UsedBytes'],
        'freeBytes': json['FreeBytes'],
        'isSSD': json['IsSSD'],
        'isRemovable': json['IsRemovable'],
    };
}

export function GetDiskInfoRespToJSON(value?: GetDiskInfoResp | null): any {
    if (value == null) return value;
    return {
        'Drive': value['drive'],
        'Label': value['label'],
        'TotalBytes': value['totalBytes'],
        'UsedBytes': value['usedBytes'],
        'FreeBytes': value['freeBytes'],
        'IsSSD': value['isSSD'],
        'IsRemovable': value['isRemovable'],
    };
}
