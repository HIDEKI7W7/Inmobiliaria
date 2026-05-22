import React from 'react';

export const Badge = ({ status }: { status: 'Verified' | 'Pending' }) => {
  const styles = status === 'Verified' 
    ? "bg-propio-green text-propio-blue" 
    : "bg-gray-200 text-gray-700";
    
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${styles}`}>
      {status}
    </span>
  );
};
