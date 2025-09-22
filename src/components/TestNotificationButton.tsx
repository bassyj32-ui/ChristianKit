import React, { useState } from 'react';
import { realNotificationService } from '../services/RealNotificationService';

export const TestNotificationButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleTestNotification = async () => {
    setIsLoading(true);
    setLastResult(null);

    try {
      const success = await realNotificationService.sendTestNotification();
      
      if (success) {
        setLastResult('✅ Test notification sent successfully!');
      } else {
        setLastResult('❌ Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setLastResult('❌ Error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      const status = await realNotificationService.getStatus();
      console.log('Notification status:', status);
      
      let statusMessage = `📊 Notification Status:\n`;
      statusMessage += `- Supported: ${status.isSupported ? '✅' : '❌'}\n`;
      statusMessage += `- Permission: ${status.permission}\n`;
      statusMessage += `- Active: ${status.isActive ? '✅' : '❌'}\n`;
      
      if (status.preferences) {
        statusMessage += `- Time: ${status.preferences.preferredTime}\n`;
        statusMessage += `- Push: ${status.preferences.pushEnabled ? '✅' : '❌'}\n`;
        statusMessage += `- Email: ${status.preferences.emailEnabled ? '✅' : '❌'}\n`;
        statusMessage += `- Level: ${status.preferences.experienceLevel}`;
      }
      
      setLastResult(statusMessage);
    } catch (error) {
      console.error('Error checking status:', error);
      setLastResult('❌ Error checking status: ' + (error as Error).message);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #667eea', 
      borderRadius: '10px', 
      margin: '20px 0',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ color: '#667eea', marginTop: 0 }}>🧪 Test Real Notifications</h3>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button
          onClick={handleTestNotification}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {isLoading ? '⏳ Sending...' : '🔔 Send Test Notification'}
        </button>
        
        <button
          onClick={handleCheckStatus}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📊 Check Status
        </button>
      </div>
      
      {lastResult && (
        <div style={{
          padding: '15px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '5px',
          whiteSpace: 'pre-line',
          fontSize: '14px',
          fontFamily: 'monospace'
        }}>
          {lastResult}
        </div>
      )}
      
      <div style={{ 
        marginTop: '15px', 
        fontSize: '12px', 
        color: '#666',
        lineHeight: '1.4'
      }}>
        <strong>How it works:</strong><br/>
        • <strong>Send Test:</strong> Triggers the daily notification system immediately<br/>
        • <strong>Check Status:</strong> Shows your current notification settings<br/>
        • <strong>Real System:</strong> Uses Supabase Edge Functions + Cron jobs<br/>
        • <strong>Works Offline:</strong> Notifications work even when app is closed
      </div>
    </div>
  );
};


