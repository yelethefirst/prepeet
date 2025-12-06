'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { templateApi } from '@/lib/api/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from '@/components/ui/field';
import { ArrowLeft, FilePlus } from 'lucide-react';
import Link from 'next/link';
import { CreateCodeTemplate } from '@/components/campaigns/CreateCodeTemplate';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  category: z.string().min(1, 'Category is required'),
  channel: z.enum(['email', 'sms', 'push']),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

function CreateTemplateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  // If in 'code' mode, show the split-view code editor
  if (mode === 'code') {
    return <CreateCodeTemplate />;
  }

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: 'marketing',
      channel: 'email'
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      const newTemplate = await templateApi.createTemplate(data);
      if (mode === 'scratch') {
          // If explicitly scratch, maybe we go to a specific view? 
          // Default behavior matches "scratch" intent (empty editor).
      }
      router.push(`/campaigns/${newTemplate.id}`);
    } catch (error) {
      console.error('Failed to create template:', error);
      // Ideally show a toast notification here
      alert('Failed to create template');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FilePlus className="size-6" />
            </div>
            <h1 className="text-xl font-bold">Create Campaign</h1>
            <p className="text-sm text-muted-foreground">
              Start a new campaign template from scratch.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" {...register('name')} placeholder="Welcome Email" />
                <FieldError errors={errors.name ? [{ message: errors.name.message }] : []} />
              </Field>
              
              <Field>
                <FieldLabel htmlFor="slug">Slug</FieldLabel>
                <Input id="slug" {...register('slug')} placeholder="welcome-email" />
                <FieldError errors={errors.slug ? [{ message: errors.slug.message }] : []} />
              </Field>

              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Select onValueChange={(val) => setValue('category', val)} defaultValue="marketing">
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={errors.category ? [{ message: errors.category.message }] : []} />
              </Field>

              <Field>
                <FieldLabel htmlFor="channel">Channel</FieldLabel>
                <Select onValueChange={(val: any) => setValue('channel', val)} defaultValue="email">
                  <SelectTrigger>
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push Notification</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={errors.channel ? [{ message: errors.channel.message }] : []} />
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea id="description" {...register('description')} placeholder="Brief description of this template..." />
              </Field>

              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  Create Template
                </Button>
                <Button variant="ghost" type="button" onClick={() => router.back()} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Campaigns
                </Button>
              </div>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateTemplatePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <CreateTemplateContent />
    </Suspense>
  );
}


