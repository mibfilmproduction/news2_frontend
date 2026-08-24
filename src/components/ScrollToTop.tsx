import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component that automatically scrolls to the top of the page
 * whenever the route changes. Place this component at the top level of your app,
 * typically right inside your Router component.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  
  useEffect(() => {
    // If there's no hash in the URL, scroll to top
    if (!hash) {
      window.scrollTo(0, 0);
    } 
    // If there is a hash, scroll to the element with that id (for anchor links)
    else {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [pathname, hash]); // Trigger effect when route changes
  
  return null; // This component doesn't render anything
}

export default ScrollToTop;
