'use client';

import { useParams } from 'next/navigation';
import { useNavigation } from '@/hooks/useNavigation';
import { notFound } from 'next/navigation';
import { useEffect } from 'react';
import { Container } from '@mantine/core';

export default function DynamicPage() {
  const params = useParams();
  const { routes, isLoading } = useNavigation();
  const currentPath = '/' + (params?.slug ? (Array.isArray(params.slug) ? params.slug.join('/') : params.slug) : '');

  useEffect(() => {
    if (!isLoading && routes.length > 0) {
      const isValidRoute = routes.some(route => route.path === currentPath);
      if (!isValidRoute) {
        notFound();
      }
    }
  }, [routes, currentPath, isLoading]);

  return (
    <Container size="md">
      {/* Your page content will be here */}
      <h1>Dynamic Page Content</h1>
      <p>Current path: {currentPath}</p>
    </Container>
  );
}
