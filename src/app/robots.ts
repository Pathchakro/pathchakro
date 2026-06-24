import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('host') || 'pathchakro.com';
  
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol = (forwardedProto === 'http' || forwardedProto === 'https') 
    ? forwardedProto 
    : (host.includes('localhost') ? 'http' : 'https');
    
  const BASE_URL = `${protocol}://${host}`;
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/'
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
