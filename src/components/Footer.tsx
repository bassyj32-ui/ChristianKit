import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-900 border-t border-neutral-800 py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">CK</span>
            </div>
            <span className="text-gray-400 text-sm">© 2024 ChristianKit. All rights reserved.</span>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
            <a 
              href="/pricing.html" 
              className="text-gray-400 hover:text-green-400 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pricing
            </a>
            <a 
              href="/terms.html" 
              className="text-gray-400 hover:text-green-400 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>
            <a 
              href="/privacy.html" 
              className="text-gray-400 hover:text-green-400 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            <a 
              href="/refund.html" 
              className="text-gray-400 hover:text-green-400 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Refund Policy
            </a>
            <a 
              href="mailto:support@christiankit.app" 
              className="text-gray-400 hover:text-green-400 transition-colors duration-200"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
