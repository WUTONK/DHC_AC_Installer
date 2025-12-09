import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface DevOption {
    id: string;
    label: string;
    component: React.ReactNode;
    order?: number; // 用于排序
}

interface DevModeContextType {
    isDevMode: boolean;
    toggleDevMode: () => void;
    registerDevOption: (option: DevOption) => void;
    unregisterDevOption: (id: string) => void;
    devOptions: DevOption[];
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

export const DevModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isDevMode, setIsDevMode] = useState<boolean>(false);
    const [devOptions, setDevOptions] = useState<DevOption[]>([]);

    const toggleDevMode = (): void => {
        setIsDevMode(prev => !prev);
    };

    const registerDevOption = useCallback((option: DevOption): void => {
        setDevOptions(prev => {
            // 检查是否已存在
            const exists = prev.find(opt => opt.id === option.id);
            if (exists) {
                // 更新现有选项
                return prev.map(opt => opt.id === option.id ? option : opt).sort((a, b) => (a.order || 999) - (b.order || 999));
            }
            // 添加新选项并排序
            return [...prev, option].sort((a, b) => (a.order || 999) - (b.order || 999));
        });
    }, []);

    const unregisterDevOption = useCallback((id: string): void => {
        setDevOptions(prev => prev.filter(opt => opt.id !== id));
    }, []);

    return (
        <DevModeContext.Provider value={{ isDevMode, toggleDevMode, registerDevOption, unregisterDevOption, devOptions }}>
            {children}
        </DevModeContext.Provider>
    );
};

export const useDevMode = (): DevModeContextType => {
    const context = useContext(DevModeContext);
    if (context === undefined) {
        throw new Error('useDevMode must be used within a DevModeProvider');
    }
    return context;
};

