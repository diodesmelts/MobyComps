import React, { useState } from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fill?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const Image: React.FC<ImageProps> = ({
  src,
  alt,
  fill = false,
  className = '',
  onLoad: propOnLoad,
  onError: propOnError,
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    propOnLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    propOnError?.();
  };

  // Handle various URL formats
  let imageUrl = src;
  
  console.log("Original image URL:", src);
  
  // If it's a relative path but doesn't start with a slash, add one
  if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
    imageUrl = `/${src}`;
  }
  
  // Always add the base URL to uploads paths
  if (src.startsWith('/uploads/')) {
    // Fix for uploads URLs when running from Vite dev server
    imageUrl = `http://localhost:5000${src}`;
    console.log("Fixed upload URL:", imageUrl);
  }

  const imageStyle = fill 
    ? { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } 
    : {};

  return (
    <>
      {!isLoaded && !hasError && (
        <div 
          className={`bg-gray-200 animate-pulse ${fill ? 'absolute inset-0' : ''}`} 
          style={fill ? { width: '100%', height: '100%' } : rest.width && rest.height ? { width: rest.width, height: rest.height } : {}}
        />
      )}
      
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${!isLoaded ? 'invisible' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        style={imageStyle as React.CSSProperties}
        {...rest}
      />
      
      {hasError && (
        <div 
          className={`bg-gray-200 flex items-center justify-center ${fill ? 'absolute inset-0' : ''}`}
          style={fill ? { width: '100%', height: '100%' } : rest.width && rest.height ? { width: rest.width, height: rest.height } : {}}
        >
          <span className="text-gray-400 text-xs">Failed to load</span>
        </div>
      )}
    </>
  );
};

export default Image;