'use client';

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { templateApi } from '@/lib/api/templates';
import { renderJinja2 } from '@/lib/utils/jinja2-renderer';
import { Button } from '@/components/ui/button';
import { Loader2, Smartphone, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PreviewPanel() {
  const { draft, testVariables } = useEditorStore();
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  const handleRender = async () => {
    // We always have draft at least
    setIsLoading(true);
    try {
        console.log('Rendering preview client-side');
        const html = renderJinja2(draft.body_html, testVariables);
        setRenderedHtml(html);
    } catch (error) {
      console.error('Failed to render:', error);
      setRenderedHtml('<div class="text-red-500">Failed to render template</div>');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-render when content or variables change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRender();
    }, 500);
    return () => clearTimeout(timer);
  }, [draft.body_html, testVariables]);

  return (
    <div className="flex flex-col h-full border-l bg-background">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Preview</h3>
          <div className="flex gap-2">
            <Button
              variant={device === 'mobile' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setDevice('mobile')}
              title="Mobile View"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              variant={device === 'desktop' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setDevice('desktop')}
              title="Desktop View"
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className={cn(
        "flex-1 overflow-auto flex justify-center",
        device === 'mobile' ? "bg-muted/10 p-8 items-start" : "bg-white items-stretch"
      )}>
        <div 
          className={cn(
            "bg-white transition-all duration-300 origin-top",
            device === 'mobile' && "shadow-sm"
          )}
          style={{ 
            width: device === 'mobile' ? '375px' : '100%',
            height: device === 'mobile' ? '667px' : '100%',
            minHeight: device === 'mobile' ? '667px' : '100%',
            borderRadius: device === 'mobile' ? '12px' : '0',
            border: device === 'mobile' ? '8px solid #333' : 'none'
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <iframe
              srcDoc={renderedHtml}
              className="w-full h-full border-none bg-white"
              title="Preview"
              style={{
                borderRadius: device === 'mobile' ? '4px' : '0'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
