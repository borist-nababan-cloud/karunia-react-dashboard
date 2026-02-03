import React from 'react';

// Simplified Image component for migration
// Ignores Next.js specific props like fill, priority, etc. if they break img tag
const Image: React.FC<any> = ({ src, alt, width, height, className, style, ...props }) => {
    return (
        <img
            src={src}
            alt={alt || ''}
            width={width}
            height={height}
            className={className}
            style={style}
        // {...props} // Start cautious, only pass safe props
        />
    );
};

export default Image;
