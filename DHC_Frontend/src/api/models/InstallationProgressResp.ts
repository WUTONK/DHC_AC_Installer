/* tslint:disable */
/* eslint-disable */
/**
 * DHC AC Installer API
 * The version of the OpenAPI document: 2.0.0
 */

import type { InstallCategoryProgress } from './InstallCategoryProgress';
import { InstallCategoryProgressFromJSON } from './InstallCategoryProgress';

export interface InstallationProgressResp {
    installId: string;
    status: string;
    totalProgress: number;
    categories: InstallCategoryProgress[];
    startTime: number;
    endTime?: number | null;
    error?: string | null;
}

export function InstallationProgressRespFromJSON(json: any): InstallationProgressResp {
    if (json == null) return json;
    return {
        'installId': json['installId'],
        'status': json['status'],
        'totalProgress': json['totalProgress'],
        'categories': (json['categories'] as any[]).map(InstallCategoryProgressFromJSON),
        'startTime': json['startTime'],
        'endTime': json['endTime'],
        'error': json['error'],
    };
}

export function InstallationProgressRespToJSON(value?: InstallationProgressResp | null): any {
    if (value == null) return value;
    return {
        'installId': value['installId'],
        'status': value['status'],
        'totalProgress': value['totalProgress'],
        'categories': value['categories'],
        'startTime': value['startTime'],
        'endTime': value['endTime'],
        'error': value['error'],
    };
}
