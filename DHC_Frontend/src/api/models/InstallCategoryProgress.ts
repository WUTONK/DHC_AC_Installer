/* tslint:disable */
/* eslint-disable */
/**
 * DHC AC Installer API
 * The version of the OpenAPI document: 2.0.0
 */

export interface InstallCategoryProgress {
    categoryId: string;
    categoryName: string;
    status: string;
    progress: number;
    currentItem?: string | null;
    totalItems?: number;
    completedItems?: number;
    subProgress?: number;
}

export function InstallCategoryProgressFromJSON(json: any): InstallCategoryProgress {
    if (json == null) return json;
    return {
        'categoryId': json['categoryId'],
        'categoryName': json['categoryName'],
        'status': json['status'],
        'progress': json['progress'],
        'currentItem': json['currentItem'],
        'totalItems': json['totalItems'],
        'completedItems': json['completedItems'],
        'subProgress': json['subProgress'],
    };
}

export function InstallCategoryProgressToJSON(value?: InstallCategoryProgress | null): any {
    if (value == null) return value;
    return {
        'categoryId': value['categoryId'],
        'categoryName': value['categoryName'],
        'status': value['status'],
        'progress': value['progress'],
        'currentItem': value['currentItem'],
        'totalItems': value['totalItems'],
        'completedItems': value['completedItems'],
        'subProgress': value['subProgress'],
    };
}
