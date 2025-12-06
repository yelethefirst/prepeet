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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EmailCampaignsPage() {
  const { data: templates = [], isLoading, error, refetch } = useQuery({
    queryKey: ['templates', 'email'],
    queryFn: () => templateApi.listEmailTemplates(),
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
              Failed to load email campaigns. Please check your connection and try again.
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
          <h2 className="text-3xl font-bold tracking-tight">Email Campaigns</h2>
          <p className="text-muted-foreground">Manage your email marketing and transactional templates</p>
        </div>
        <CreateCampaignActions />
      </div>

      <Tabs defaultValue="created" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="prepeet">Prepeet Templates</TabsTrigger>
          <TabsTrigger value="created">Created</TabsTrigger>
          <TabsTrigger value="sent">Recently Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="prepeet">
          <div className="min-h-[200px] flex items-center justify-center border rounded-lg border-dashed">
            <div className="text-center space-y-2">
              <p className="font-medium">Prepeet Templates Coming Soon</p>
              <p className="text-sm text-muted-foreground">Browse our library of high-converting templates.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="created" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="sent">
          <div className="min-h-[200px] flex items-center justify-center border rounded-lg border-dashed">
             <div className="text-center space-y-2">
              <p className="font-medium">No Recent Campaigns</p>
              <p className="text-sm text-muted-foreground">Your recently sent campaigns will appear here.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
