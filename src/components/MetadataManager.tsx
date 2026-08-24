import { useEffect } from 'react';

interface MetadataManagerProps {
  title: string;
  description: string;
  keywords: string;
  image?: string;
}

/**
 * A component that directly manages document metadata without using React Helmet
 * to avoid the "Cannot convert a Symbol value to a string" error
 */
const MetadataManager: React.FC<MetadataManagerProps> = ({
  title,
  description,
  keywords,
  image
}) => {
  useEffect(() => {
    // Set the page title directly
    document.title = title;
    
    // Find existing meta tags or create new ones
    const setMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };
    
    // Set standard meta tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    
    // Set Open Graph tags
    const setOgTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="og:${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', `og:${property}`);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };
    
    setOgTag('title', title);
    setOgTag('description', description);
    if (image) {
      setOgTag('image', image);
    }
    
    // Clean up function to restore title when component unmounts
    return () => {
      document.title = 'mibDaily News';
    };
  }, [title, description, keywords, image]);
  
  // This component doesn't render anything
  return null;
};

export default MetadataManager;
