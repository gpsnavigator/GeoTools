import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDismissable } from '../../hooks/useDismissable';
import { GITHUB_REPO_URL, OSM_CZ_HOME_URL } from '../../utils/externalLinks';
import LanguageToggle from './LanguageToggle';

type NavLabelKey = 'nav.home' | 'nav.gpxPhotos';

interface NavItem {
  to: string;
  labelKey: NavLabelKey;
  /** Only active on this exact path, not on the pages below it. */
  end?: boolean;
}

const MAIN_NAV: NavItem[] = [{ to: '/', labelKey: 'nav.home', end: true }];

/** The Tools menu, shared by the desktop dropdown and the mobile menu. */
const TOOLS_NAV: NavItem[] = [{ to: '/tools/gpx-photos', labelKey: 'nav.gpxPhotos' }];

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 011.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
);

const desktopNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-2 py-1.5 rounded-md text-sm font-medium transition ${
    isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
  }`;

const menuNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center justify-between rounded-md px-3 py-2 text-sm ${
    isActive ? 'bg-gray-700 text-white' : 'text-gray-200 hover:bg-gray-700 hover:text-white'
  }`;

interface NavMenuProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/** A top-bar dropdown (Tools): closes on Escape or a click outside, highlighted while one of its pages is open. */
const DesktopNavMenu: React.FC<NavMenuProps & { onClose: () => void; isActive: boolean }> = ({
  label, isOpen, onToggle, onClose, isActive, children,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissable(menuRef, isOpen, onClose);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={onToggle}
        className={`px-2 py-1.5 rounded-md text-sm font-medium transition inline-flex items-center gap-1 ${
          isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
        }`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {label}
        <ChevronIcon open={isOpen} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-60 rounded-md border border-gray-700 bg-gray-800 p-1.5 shadow-xl z-[60]">
          {children}
        </div>
      )}
    </div>
  );
};

/** The same menu as a collapsible section of the mobile menu. */
const MobileNavMenu: React.FC<NavMenuProps> = ({ label, isOpen, onToggle, children }) => (
  <div className="rounded-md border border-gray-700 overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-3 py-2 text-left text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 flex items-center justify-between"
      aria-expanded={isOpen}
    >
      <span>{label}</span>
      <ChevronIcon open={isOpen} />
    </button>
    {isOpen && <div className="border-t border-gray-700 bg-gray-900/50 p-1">{children}</div>}
  </div>
);

const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const location = useLocation();

  const closeMenus = useCallback(() => {
    setIsMenuOpen(false);
    setIsToolsOpen(false);
    setIsMobileToolsOpen(false);
  }, []);

  // Any navigation (including back/forward) closes whatever menu is open.
  useEffect(() => {
    closeMenus();
  }, [location.pathname, closeMenus]);

  const closeToolsMenu = useCallback(() => setIsToolsOpen(false), []);
  const isToolsPage = location.pathname.startsWith('/tools/');

  // Full-screen maps (ExpandableMap) start right below the sticky header, so publish its height as a CSS variable.
  useEffect(() => {
    const root = document.documentElement;
    const headerElement = headerRef.current;
    if (!headerElement) {
      return;
    }

    const updateHeaderHeight = () => {
      root.style.setProperty('--site-header-height', `${headerElement.offsetHeight}px`);
    };

    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(headerElement);
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  const toolsLinks = TOOLS_NAV.map((item) => (
    <NavLink key={item.to} to={item.to} end={item.end} onClick={closeMenus} className={menuNavLinkClass}>
      {t(item.labelKey)}
    </NavLink>
  ));

  const externalLinkClass = 'text-sm text-gray-300 hover:text-white hover:underline';

  return (
    <header ref={headerRef} className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2.5 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <span className="text-2xl" aria-hidden="true">🧭</span>
          <span className="text-xl font-bold tracking-tight group-hover:text-blue-300 transition">{t('appTitle')}</span>
        </Link>

        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="text-gray-300 hover:text-white focus:outline-none p-1.5 rounded-md hover:bg-gray-700"
            aria-label={t('nav.toggleMenu')}
            aria-expanded={isMenuOpen}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-8 flex-1" aria-label={t('nav.mainNavigation')}>
          {MAIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={closeMenus} className={desktopNavLinkClass}>
              {t(item.labelKey)}
            </NavLink>
          ))}
          <DesktopNavMenu
            label={t('nav.tools')}
            isOpen={isToolsOpen}
            onToggle={() => setIsToolsOpen((open) => !open)}
            onClose={closeToolsMenu}
            isActive={isToolsPage}
          >
            {toolsLinks}
          </DesktopNavMenu>
        </nav>

        <div className="hidden md:flex items-center ml-4 gap-3">
          <a href={OSM_CZ_HOME_URL} target="_blank" rel="noopener noreferrer" className={externalLinkClass}>
            {t('nav.osmCz')}
          </a>
          <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className={externalLinkClass}>
            {t('nav.github')}
          </a>
          <div className="h-4 w-px bg-gray-700" aria-hidden="true" />
          <LanguageToggle />
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden bg-gray-800 px-4 py-3 space-y-1 border-t border-gray-700 animate-[fadeIn_0.15s_ease-in]" aria-label={t('nav.mainNavigation')}>
          {MAIN_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={closeMenus} className={mobileNavLinkClass}>
              {t(item.labelKey)}
            </NavLink>
          ))}
          <MobileNavMenu label={t('nav.tools')} isOpen={isMobileToolsOpen} onToggle={() => setIsMobileToolsOpen((open) => !open)}>
            {toolsLinks}
          </MobileNavMenu>
          <div className="pt-3 mt-2 border-t border-gray-700 space-y-1">
            <a href={OSM_CZ_HOME_URL} target="_blank" rel="noopener noreferrer" className={`block ${externalLinkClass}`}>
              {t('nav.osmCz')}
            </a>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className={`block ${externalLinkClass}`}>
              {t('nav.github')}
            </a>
          </div>
          <div className="pt-3 mt-2 border-t border-gray-700">
            <LanguageToggle />
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
