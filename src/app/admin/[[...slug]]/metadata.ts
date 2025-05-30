import { Metadata } from 'next';

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: {
      template: '%s | Admin',
      default: 'SelfHelp'
    },
    description: "SelfHelp Research CMS builder",
    viewport: {
      width: 'device-width',
      initialScale: 1,
    },
    icons: {
      icon: '/favicon.svg',
    },
  }
}
