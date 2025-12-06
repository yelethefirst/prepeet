'use client';

import React from 'react';
import { Template } from '@/types/template';
import TemplateCard from './TemplateCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { FilePlus } from 'lucide-react';


interface TemplateListProps {
  templates: Template[];
  isLoading: boolean;
}

export default function TemplateList({ templates, isLoading }: TemplateListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
     <div className='flex flex-col items-center h-full justify-center'>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FilePlus />
          </EmptyMedia>
          <EmptyTitle>No templates created</EmptyTitle>
          <EmptyDescription>
            You haven't created any email templates yet. Start by creating your first template to engage your users.
          </EmptyDescription>
        </EmptyHeader>

      </Empty>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}
