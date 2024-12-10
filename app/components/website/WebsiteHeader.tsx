'use client';

import { Container, Group, Burger, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { WebsiteHeaderMenu } from './WebsiteHeaderMenu';
import { AuthButton } from '@/components/auth/AuthButton';

export function WebsiteHeader() {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <header className="h-14 mb-30 bg-[var(--mantine-color-body)] border-b border-[var(--mantine-color-gray-3)] dark:border-[var(--mantine-color-dark-4)]">
      <Container size="md">
        <div className="h-14 flex justify-between items-center">
          {/* Mantine component with its built-in props */}
          <Text 
            size="xl" 
            fw={700}
            c="blue"
            className="hover:text-blue-600 transition-colors"
          >
            Your Logo
          </Text>
          
          <WebsiteHeaderMenu />
          <AuthButton />
          
          {/* Mantine component with Tailwind classes */}
          <Burger 
            opened={opened} 
            onClick={toggle} 
            size="sm" 
            hiddenFrom="sm"
            className="ml-auto transition-colors duration-200 hover:bg-[var(--mantine-color-gray-0)]"
          />
        </div>
      </Container>
    </header>
  );
}
