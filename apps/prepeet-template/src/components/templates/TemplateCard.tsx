'use client';

import React from 'react';
import Link from 'next/link';
import { Template } from '@/types/template';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Copy, MoreVertical, Calendar } from 'lucide-react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { templateApi } from '@/lib/api/templates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trash2 } from 'lucide-react';

interface TemplateCardProps {
  template: Template;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const queryClient = useQueryClient();

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

  const handleDelete = () => {
      if (confirm("Are you sure you want to delete this template?")) {
          deleteMutation.mutate(template.id);
      }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-muted-foreground/10 hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge variant="secondary" className="mb-2 capitalize">
            {template.category}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-lg font-bold truncate" title={template.name}>
          {template.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
          {template.description || 'No description provided.'}
        </p>
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="mr-1 h-3 w-3" />
          <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 gap-2">
        <div className="flex-1">
             <Button variant="outline" size="sm" className="w-full">
                <Copy className="h-3 w-3 mr-2" />
                Clone
            </Button>
        </div>
        <Link href={`/campaigns/${template.id}`} className="flex-1">
          <Button size="sm" className="w-full">
            <Edit className="h-3 w-3 mr-2" />
            Edit
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
