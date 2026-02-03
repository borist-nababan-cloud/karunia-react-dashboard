import React from 'react';
import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom';

interface NextLinkProps extends Omit<RouterLinkProps, 'to'> {
    href: string;
}

const Link: React.FC<NextLinkProps> = ({ href, ...props }) => {
    return <RouterLink to={href} {...props} />;
};

export default Link;
