export interface DiskInfo {
    label: string;
    total: number; // bytes
    used: number;  // bytes
    free: number;  // bytes
}

export interface InstallMode {
    id: string;
    name: string;
    icon: React.ReactNode;
    size: number;
    desc: string;
    color: string;
    recommended?: boolean;
}

export interface RequirementConfig {
    title: string;
    cpu: string;
    gpu: string;
    ram: string;
    note: string;
}

export interface InstallationCreateResponse {
    id: string;
    versionId: string;
    status: string;
    startTime: number;
}

export interface InstallationCategoryProgress {
    categoryId: string;
    categoryName: string;
    status: 'waiting' | 'active' | 'completed' | 'failed' | string;
    progress: number;
    currentItem: string;
    totalItems: number;
    completedItems: number;
    subProgress: number;
}

export interface InstallationProgressResponse {
    installId: string;
    status: 'preparing' | 'installing' | 'completed' | 'failed' | string;
    totalProgress: number;
    categories: InstallationCategoryProgress[];
    startTime: number;
    endTime: number | null;
    error: string | null;
}

export type InstallStep = 'SELECT_MODE' | 'PRE_CHECK' | 'INSTALLING' | 'POST_INSTALL';

export interface OneClickInstallerProps {
    onNavigate?: (page: string) => void;
    onNavigateToSettingsFromDiskLow?: () => void;
}
