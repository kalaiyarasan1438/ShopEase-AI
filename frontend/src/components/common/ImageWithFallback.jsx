import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

export default function ImageWithFallback({ 
  src, 
  alt = 'Product image', 
  wrapperClassName = '',
  imgClassName = '',
  fallbackIcon = <Package size={40} className="text-gray-400" />,
  fallbackUrl = ''
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackUrl || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset state whenever the primary src changes
  useEffect(() => {
    setCurrentSrc(src || fallbackUrl || '');
    setIsLoading(true);
    setHasError(false);
  }, [src, fallbackUrl]);

  if (!currentSrc) {
    return (
      <div className={`relative overflow-hidden bg-dark-surface3 flex items-center justify-center ${wrapperClassName}`}>
        <div className="flex flex-col items-center justify-center text-gray-500 w-full h-full p-4 text-center">
          {fallbackIcon}
          <span className="text-[10px] mt-2 font-medium opacity-50 uppercase tracking-wider truncate w-full px-2">{alt}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-dark-surface3 flex items-center justify-center ${wrapperClassName}`}>
      {/* Loading skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-dark-surface3 animate-pulse" />
      )}

      {hasError ? (
        /* Broken image fallback UI */
        <div className="flex flex-col items-center justify-center text-gray-500 w-full h-full p-4 text-center">
          {fallbackIcon}
          <span className="text-[10px] mt-2 font-medium opacity-50 uppercase tracking-wider truncate w-full px-2">{alt}</span>
        </div>
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          loading="lazy"
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${imgClassName}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            // If primary src failed and a fallback URL exists, try fallback once
            if (fallbackUrl && currentSrc !== fallbackUrl) {
              setCurrentSrc(fallbackUrl);
              setIsLoading(true);
            } else {
              setIsLoading(false);
              setHasError(true);
            }
          }}
        />
      )}
    </div>
  );
}
