'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { templateApi } from '@/lib/api/templates';
import { useEditorStore } from '@/lib/stores/editor-store';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateCodeTemplate } from '@/components/campaigns/CreateCodeTemplate';

export default function EditorPage() {
  const params = useParams();
  const id = params.id as string;
  const { initialize } = useEditorStore();

  const { data: templateData, isLoading: isTemplateLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => templateApi.getTemplate(id),
  });

  const { data: versionsData, isLoading: isVersionsLoading } = useQuery({
    queryKey: ['template', id, 'versions'],
    queryFn: () => templateApi.listVersions(id),
    enabled: !!templateData,
  });

  useEffect(() => {
    if (templateData && versionsData) {
      // Use the latest version or null if no versions
      const latest = versionsData.length > 0 ? versionsData[versionsData.length - 1] : null;
      initialize(templateData, latest);
    }
  }, [templateData, versionsData, initialize]);

  if (isTemplateLoading || isVersionsLoading) {
    return (
       <div className="h-screen flex flex-col bg-background p-4 gap-4">
          <div className="flex justify-between items-center h-16 border-b pb-2">
             <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8" />
                <div className="space-y-2">
                   <Skeleton className="h-4 w-48" />
                   <Skeleton className="h-4 w-24" />
                </div>
             </div>
             <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
             </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
             <Skeleton className="h-8 w-32" />
             <Skeleton className="h-8 w-24" />
          </div>
          <div className="flex-1 flex gap-4 h-full overflow-hidden">
             <Skeleton className="flex-1 h-full rounded-md" />
          </div>
       </div>
    );
  }

  return <CreateCodeTemplate templateId={id} />;
}
