'use client';

import React from 'react';
import Link from 'next/link';
import { Template } from '@/types/template';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Copy, MoreVertical, Calendar, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { templateApi } from '@/lib/api/templates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TemplateCardProps {
  template: Template;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery({
    queryKey: ['template', template.id, 'versions'],
    queryFn: () => templateApi.listVersions(template.id),
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });

  // Sort versions to ensure we get the latest
  const sortedVersions = React.useMemo(() => {
    if (!versions) return [];
    return [...versions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [versions]);

  const latestVersion = sortedVersions.length > 0 ? sortedVersions[0] : null;
  const htmlContent = latestVersion?.body_html || '';

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templateApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => {
        console.error("Failed to delete", error);
        alert("Failed to delete template");
    }
  });

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card link click
      if (confirm("Are you sure you want to delete this template?")) {
          deleteMutation.mutate(template.id);
      }
  }

  return (
    <Card className="group relative hover:shadow-xl transition-all duration-300 border-muted-foreground/10 flex flex-col overflow-hidden h-full bg-card p-0 gap-0">
      <Link href={`/campaigns/${template.id}`} className="absolute inset-0 z-0" aria-label={`Edit ${template.name}`} />
      
      {/* Preview Section */}
      <div className="relative aspect-[5/6] w-full bg-muted/10 border-b overflow-hidden">
          {isLoading ? (
              <Skeleton className="w-full h-full" />
          ) : htmlContent ? (
              <div className="w-[400%] h-[400%] origin-top-left transform scale-25 pointer-events-none select-none bg-white">
                  <iframe 
                      srcDoc={`<style>body{margin:0;overflow:hidden}</style>${htmlContent}`}
                      className="w-full h-full border-none"
                      title={`Preview of ${template.name}`}
                      loading="lazy"
                      sandbox="allow-same-origin"
                      tabIndex={-1} 
                  />
                  <div className="absolute inset-0 bg-transparent" />
              </div>
          ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/5 gap-1">
                  <div className="h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center">
                    <Edit className="h-4 w-4 opacity-50" />
                  </div>
                  <span className="text-[10px] font-medium">No preview</span>
              </div>
          )}
          
          {/* Actions Overlay */}
          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-6 w-6 shadow-sm bg-background/80 hover:bg-background backdrop-blur-sm">
                        <MoreVertical className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Clone logic */ }}>
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        Clone
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
          
          <Badge variant="secondary" className="absolute top-1.5 left-1.5 shadow-sm capitalize opacity-90 backdrop-blur-sm bg-background/80 z-10 text-[10px] px-1.5 h-5">
             {template.category}
          </Badge>
      </div>

      <CardHeader className="px-2 pb-2 pt-0 z-10 pointer-events-none min-h-[30px] justify-center mt-2">
        <div className="flex justify-between items-center w-full">
            <CardTitle className="text-sm font-semibold truncate leading-tight w-full" title={template.name}>
            {template.name}
            </CardTitle>
        </div>
      </CardHeader>

      {/* Footer (Hidden default, visible on hover for extra CTA, but keeping strict size) */}
      <div className="px-3 pb-3 mt-auto z-10 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-4">
          <Button size="sm" variant="secondary" className="w-full h-7 text-xs shadow-sm" asChild>
             <Link href={`/campaigns/${template.id}`}>
                 Edit
             </Link>
          </Button>
      </div>
    </Card>
  );
}
