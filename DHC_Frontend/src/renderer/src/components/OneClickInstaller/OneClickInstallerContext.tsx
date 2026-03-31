import { createContext, useContext } from 'react';

export const OneClickInstallerContext = createContext<any>(null);

export const useOneClickInstaller = () => {
    const context = useContext(OneClickInstallerContext);
    if (!context) {
        throw new Error('useOneClickInstaller must be used within a OneClickInstallerProvider');
    }
    return context;
};
