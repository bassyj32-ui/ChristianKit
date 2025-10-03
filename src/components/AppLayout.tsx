import React from 'react';
import { FloatingProgressTab } from './FloatingProgressTab';

interface AppLayoutProps {
  children: React.ReactNode;
  showProgressTab?: boolean;
  onPrayerStart?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showProgressTab = true,
  onPrayerStart
}) => {
  return (
    <div className="relative min-h-screen">
      {/* Main Content */}
      {children}
      
      {/* Global Floating Progress Tab */}
      {showProgressTab && (
        <FloatingProgressTab 
          onPrayerStart={onPrayerStart}
        />
      )}
    </div>
  );
};





















