import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const MainLayout: React.FC = () => (
  <div className="flex flex-col min-h-screen bg-gray-50">
    <Header />
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-0">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default MainLayout;
