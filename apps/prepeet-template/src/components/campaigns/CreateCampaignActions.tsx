'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Plus, Code, ChevronDown, FileCode, FolderArchive } from 'lucide-react';
import { ImportCampaignDialog } from './ImportCampaignDialog';
import { toast } from 'sonner';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { templateApi } from "@/lib/api/templates";
import { DEFAULT_EMAIL_HTML } from "@/lib/constants/templates";

export function CreateCampaignActions() {
  const router = useRouter();
  const [importType, setImportType] = useState<'html' | 'zip' | null>(null);
  const [showCodeWarning, setShowCodeWarning] = useState(false);
  const [name, setName] = useState('Untitled Template');
  const [slug, setSlug] = useState('');
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const handleImport = async (file: File) => {
    // START_MOCK_UPLOAD
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Importing file:', file.name);
    toast.success(`Successfully imported ${file.name}`);
    // END_MOCK_UPLOAD
  };

  const handleCreate = async () => {
    if (!name || !slug) {
        toast.error("Please enter a name and slug");
        return;
    }

    setIsCreating(true);
    try {
        // 1. Create Template
        const newTemplate = await templateApi.createTemplate({
            name,
            slug,
            category: 'marketing', // Default category
            channel: 'email',
        });

        // 2. Create Initial Version
        await templateApi.createVersion(newTemplate.id, {
            body_html: DEFAULT_EMAIL_HTML,
            body_text: '',
            subject: '*|MC:SUBJECT|*',
            variables_schema: {},
            language: 'en-US'
        });

        toast.success("Template created successfully");
        router.push(`/campaigns/${newTemplate.id}`);
    } catch (error: any) {
        console.error("Failed to create template:", error);
        toast.error(error.message || "Failed to create template");
        setIsCreating(false);
    }
  };

  const resetState = (open: boolean) => {
      setShowCodeWarning(open);
      if (!open) {
          setTimeout(() => {
              setStep(1);
              setName('Untitled Template');
              setSlug('');
              setIsCreating(false);
          }, 300);
      }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <div className="flex w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto rounded-r-none border-r-0"
            onClick={() => setShowCodeWarning(true)}
          >
            <Code className="mr-2 h-4 w-4" />
            Code your own
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="px-2 rounded-l-none">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setImportType('html')}>
                <FileCode className="mr-2 h-4 w-4" />
                Import HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setImportType('zip')}>
                <FolderArchive className="mr-2 h-4 w-4" />
                Import ZIP
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Link href="/campaigns/new?mode=scratch" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create from scratch
          </Button>
        </Link>
      </div>

      <ImportCampaignDialog 
        open={!!importType} 
        onOpenChange={(open) => !open && setImportType(null)}
        type={importType || 'html'}
        onImport={handleImport}
      />

      <Dialog open={showCodeWarning} onOpenChange={resetState}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{step === 1 ? 'Code your own' : 'Template Details'}</DialogTitle>
            <DialogDescription asChild>
                <div className="space-y-2">
                    {step === 1 ? (
                        <>
                            <p>Custom-coded templates can't be switched to the drag-and-drop builder once they're created.</p>
                            <p>You're about to build your template using the Code Your Own editor.</p>
                        </>
                    ) : (
                        <p>Enter the basic information for your new template.</p>
                    )}
                </div>
            </DialogDescription>
          </DialogHeader>

          {step === 2 && (
             <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
                    }}
                    placeholder="My Awesome Template"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-awesome-template"
                  />
                </div>
             </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => resetState(false)} disabled={isCreating}>Cancel</Button>
            {step === 1 ? (
                <Button onClick={() => setStep(2)}>Continue</Button>
            ) : (
                <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Next
                </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
