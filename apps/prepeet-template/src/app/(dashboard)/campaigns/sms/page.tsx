'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { templateApi } from '@/lib/api/templates';
import TemplateList from '@/components/templates/TemplateList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { Plus, Search, AlertCircle } from 'lucide-react';
import { CreateCampaignActions } from '@/components/campaigns/CreateCampaignActions';

export default function SmsCampaignsPage() {
  const { data: templates = [], isLoading, error, refetch } = useQuery({
    queryKey: ['templates', 'sms'],
    queryFn: () => templateApi.listSmsTemplates(),
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon" className="bg-red-100 text-red-600">
              <AlertCircle />
            </EmptyMedia>
            <EmptyTitle>Something went wrong</EmptyTitle>
            <EmptyDescription>
              Failed to load SMS campaigns. Please check your connection and try again.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SMS Campaigns</h2>
          <p className="text-muted-foreground">Manage your SMS marketing and notifications</p>
        </div>
        <CreateCampaignActions />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            className="pl-9 w-full"
          />
        </div>
      </div>

      <TemplateList templates={templates} isLoading={isLoading} />
    </div>
  );
}
