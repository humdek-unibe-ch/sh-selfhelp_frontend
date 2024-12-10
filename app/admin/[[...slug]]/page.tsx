'use client';

import { useParams } from 'next/navigation';

export default function AdminPage() {
  const params = useParams();
  const path = params.slug ? (Array.isArray(params.slug) ? params.slug.join('/') : params.slug) : 'dashboard';
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin {path}</h1>
      <p>This is the admin area for: {path}</p>
    </div>
  );
}
