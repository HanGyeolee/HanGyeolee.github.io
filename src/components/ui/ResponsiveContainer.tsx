import React from 'react';

const ResponsiveContainer = ({ children }) => {
  const scale = 0.625;

  return (
    <div className="w-full">
      {/* Desktop version */}
      <div className="hidden md:block">
        {children}
      </div>
      
      {/* Mobile version */}
      <div className="block md:hidden">
        <div 
          className="transform origin-top-left"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center left',
            width: `${(1 / scale) * 100}%`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export {ResponsiveContainer};