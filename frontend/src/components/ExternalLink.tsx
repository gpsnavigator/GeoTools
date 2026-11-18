import React from 'react';

type ExternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** A link to another site, opened in a new tab without giving that site access to this one (noopener noreferrer). */
const ExternalLink: React.FC<ExternalLinkProps> = ({ className = 'text-blue-600 hover:underline', children, ...props }) => (
  <a target="_blank" rel="noopener noreferrer" className={className} {...props}>
    {children}
  </a>
);

export default ExternalLink;
