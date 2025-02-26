import React from 'react';
import { ChevronDown } from 'lucide-react';

const ScrollIndicator = ({ color = "white" }) => {
  return (
    <div className="fixed bottom-8 left-1/2 transform inline-flex flex-col items-center">
      <p className={`text-xs tracking-widest text-${color}/80 mt-2 animate-bounce`}>스크롤</p>
      <div className={`flex flex-col items-center text-${color}/80 animate-bounce`}>
        <ChevronDown className={`w-6 h-6 text-${color}/80`} />
      </div>
    </div>
  );
};

export {ScrollIndicator};