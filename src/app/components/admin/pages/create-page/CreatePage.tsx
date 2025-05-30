"use client";

import { useEffect, useState, useMemo } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { useForm } from '@refinedev/mantine';

interface CreatePageModalProps {
  opened: boolean;
  onClose: () => void;
}

interface PageFormValues {
  keyword: string;
  pageType: string;
  headerPosition: boolean;
  headlessPage: boolean;
  pageAccessType: string;
  protocols: string[];
  openAccess: boolean;
  advanced: boolean;
  urlPattern: string;
  position: number | null;
}

// Mock data for existing pages
const mockPages = [
  { id: '1', content: 'Page 1', position: 10 },
  { id: '2', content: 'Page 2', position: 20 },
  { id: '3', content: 'Page 3', position: 30 },
];

export const CreatePageModal = ({ opened, onClose }: CreatePageModalProps) => {
  const [pages, setPages] = useState(mockPages);
  const [newPagePosition, setNewPagePosition] = useState<number | null>(null);

  const form = useForm<PageFormValues>({
    initialValues: {
      keyword: '',
      pageType: 'sections',
      headerPosition: false,
      headlessPage: false,
      pageAccessType: 'mobile_and_web',
      protocols: ['GET'],
      openAccess: false,
      advanced: false,
      urlPattern: '',
      position: null,
    },
  });

  // Reset form when modal is closed
  const handleClose = () => {
    form.reset();
    setNewPagePosition(null);
    onClose();
  };
  
  // When modal opens, ensure we have a clean state
  useEffect(() => {
    if (!opened) {
      // No need to do anything when closing, handleClose will handle it
    }
  }, [opened]);

  // Combine existing pages with new page if keyword exists
  const allPages = useMemo(() => {
    if (!form.values.keyword) return pages;
    
    const newPage = {
      id: 'new-page',
      content: form.values.keyword,
      position: newPagePosition ?? (pages.length + 1) * 10,
      isNew: true
    };

    if (newPagePosition === null) {
      return [...pages, newPage];
    }

    return [...pages, newPage].sort((a, b) => a.position - b.position);
  }, [pages, form.values.keyword, newPagePosition]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !form.values.keyword) return;

    const newPageIndex = allPages.findIndex(page => 'isNew' in page);
    if (newPageIndex === -1) return;

    // Calculate new position based on surrounding pages
    const destIndex = result.destination.index;
    const prevPage = destIndex > 0 ? allPages[destIndex - 1] : null;
    const nextPage = destIndex < allPages.length - 1 ? allPages[destIndex] : null;
    
    let newPosition: number;
    if (!prevPage) {
      // Placing at the start
      newPosition = nextPage ? nextPage.position / 2 : 10;
    } else if (!nextPage) {
      // Placing at the end
      newPosition = prevPage.position + 10;
    } else {
      // Placing between two pages
      newPosition = (prevPage.position + nextPage.position) / 2;
    }

    setNewPagePosition(newPosition);
  };

  const getDragHandleProps = (defaultDragHandleProps: any, isNewPage: boolean) => ({
    ...defaultDragHandleProps,
    style: {
      ...defaultDragHandleProps?.style,
      cursor: isNewPage ? 'grab' : 'not-allowed',
      color: isNewPage ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-4)',
    }
  });


  return (
    <div></div>
  );
};
