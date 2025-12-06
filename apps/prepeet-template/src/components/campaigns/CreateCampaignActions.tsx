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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CreateCampaignActions() {
  const router = useRouter();
  const [importType, setImportType] = useState<'html' | 'zip' | null>(null);
  const [showCodeWarning, setShowCodeWarning] = useState(false);

  const handleImport = async (file: File) => {
    // START_MOCK_UPLOAD
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Importing file:', file.name);
    toast.success(`Successfully imported ${file.name}`);
    // END_MOCK_UPLOAD
  };

  const handleCodeYourOwn = () => {
    router.push('/campaigns/new?mode=code');
    setShowCodeWarning(false);
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

      <AlertDialog open={showCodeWarning} onOpenChange={setShowCodeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Code your own</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2" asChild>
              <div className="text-muted-foreground text-sm">
                <p>Custom-coded templates can't be switched to the drag-and-drop builder once they're created.</p>
                <p>You're about to build your template using the Code Your Own editor.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCodeYourOwn}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
