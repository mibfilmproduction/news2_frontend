
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import NavbarTop from './NavbarTop';
import BreakingNews from './BreakingNews';
import CookieConsent from './CookieConsent';
import logo from "@/assets/MIBNEWS.IN LOGO.png"

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <NavbarTop /> 
      </header>

      <BreakingNews />

      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-between">
            <div className='justify-center text-center'>
              {/* <h3 className="text-lg font-bold mb-4"></h3> */}
              <img src={logo} alt="Logo" width={200} height={150} className='mx-auto' />
              <p className="text-gray-300 mt-4">
                Mibnews delivers the latest breaking news and top stories across politics, entertainment, sports, business, and more.
              </p>
            </div>

            <div className='justify-center text-center'>

              <h3 className="text-lg font-bold mb-4">Useful Links</h3>
              <ul className="space-y-2 justify-center text-center ">
                <li><Link to="/contact" className="text-gray-300 hover:text-white">Contact Us</Link></li>
                <li><Link to="/privacy-policy" className="text-gray-300 hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/short-posts" className="text-gray-300 hover:text-white">Short Posts</Link></li>
                <li><Link to="/reels" className="text-gray-300 hover:text-white">Reels</Link></li>
                <li><Link to="/career" className="text-gray-300 hover:text-white">Careers</Link></li>
                <li><Link to="/videos" className="text-gray-300 hover:text-white">Videos</Link></li>
              </ul>
            </div>

            <div className='justify-center text-center'>
              <h3 className="text-lg font-bold mb-4">Connect With Us</h3>
              <div className="flex space-x-4 justify-center text-center">
                <a href="https://x.com" target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white" aria-label="Twitter">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12.07a10 10 0 01-10 10 10 10 0 01-10-10 10 10 0 0110-10 10 10 0 0110 10zm-11.07-3.94h1.97c.14 0 .22.11.22.22v1.45h1.19c.11 0 .22.11.22.22v1.97c0 .11-.11.22-.22.22h-1.19v4.32c0 .33.25.58.55.58h.64c.11 0 .22.11.22.22v1.97c0 .11-.11.22-.22.22h-1.41c-1.69 0-3.05-1.36-3.05-3.05v-4.24h-.64c-.11 0-.22-.11-.22-.22v-1.97c0-.11.11-.22.22-.22h.64v-1.45c0-.11.11-.22.22-.22z"></path></svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white" aria-label="Facebook">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"></path></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white" aria-label="Instagram">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.01 14.33c-.15.3-.46.46-.78.33-2.13-.97-4.8-1.19-7.96-.65-.32.06-.66-.15-.74-.48-.07-.33.15-.66.48-.74 3.45-.62 6.38-.35 8.69.75.3.14.42.48.28.79zm1.34-2.97c-.19.38-.61.54-.99.35-2.44-1.49-6.16-1.92-9.04-1.06-.37.11-.76-.1-.87-.47-.11-.38.1-.76.47-.87 3.28-1 7.36-.5 10.14 1.2.38.19.54.61.35.99l-.06-.14zm.12-3.09c-2.93-1.74-7.76-1.9-10.55-1.05-.46.13-.93-.13-1.07-.58-.13-.45.13-.93.58-1.06 3.2-.97 8.52-.78 11.89 1.21.45.26.59.84.33 1.28-.26.43-.83.57-1.28.31l.1-.11z"></path></svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-gray-300 hover:text-white" aria-label="YouTube">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.6 15.6V8.4L15.8 12l-6.2 3.6z"></path></svg>
                </a>
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-gray-800 text-sm text-gray-400 text-center">
            &copy; {new Date().getFullYear()} Mibnews. All Rights Reserved.
          </div>
          
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
};

export default Layout;
