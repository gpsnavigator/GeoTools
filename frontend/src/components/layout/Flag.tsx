import React from 'react';
import type { Language } from '../../i18n';

/**
 * A country flag rendered as inline SVG (sourced from Wikimedia Commons), so it looks like a real
 * flag on every OS — unlike the flag emoji, which Windows renders as plain letters ("GB"/"CZ").
 */
const Flag: React.FC<{ language: Language }> = ({ language }) =>
  language === 'cs' ? (
    <svg aria-hidden="true" viewBox="0 0 900 600" className="h-3.5 w-auto" role="img">
      <rect width="900" height="600" fill="#d7141a" />
      <rect width="900" height="300" fill="#fff" />
      <path d="M 450,300 0,0 V 600 z" fill="#11457e" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 50 30" className="h-3.5 w-auto" role="img">
      <clipPath id="flag-gb-stroke">
        <path d="M25,15h25v15zv15h-25zh-25v-15zv-15h25z" />
      </clipPath>
      <path d="M0,0v30h50v-30z" fill="#012169" />
      <path d="M0,0 50,30M50,0 0,30" stroke="#fff" stroke-width="6" />
      <path d="M0,0 50,30M50,0 0,30" clipPath="url(#flag-gb-stroke)" stroke="#C8102E" stroke-width="4" />
      <path
        d="M-1 11h22v-12h8v12h22v8h-22v12h-8v-12h-22z"
        fill="#C8102E"
        stroke="#FFF"
        strokeWidth="2"
      />
    </svg>
  );

export default Flag;
