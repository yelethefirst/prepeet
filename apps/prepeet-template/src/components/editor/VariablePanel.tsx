'use client';

import React from 'react';
import { useEditorStore } from '@/lib/stores/editor-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

export default function VariablePanel() {
  const { draft, updateDraft, testVariables, setTestVariable } = useEditorStore();

  const variables = draft.variables_schema?.properties || {};

  const handleAddVariable = () => {
    const newSchema = {
      ...draft.variables_schema,
      properties: {
        ...variables,
        [`new_var_${Object.keys(variables).length + 1}`]: { type: 'string' }
      }
    };

    updateDraft('variables_schema', newSchema);
  };

  const handleUpdateVariable = (oldKey: string, newKey: string, type: string) => {
    const newProps = { ...variables };
    
    if (oldKey !== newKey) {
      delete newProps[oldKey];
      if (testVariables[oldKey] !== undefined) {
        const val = testVariables[oldKey];
        setTestVariable(newKey, val);
      }
    }
    
    newProps[newKey] = { type };

    updateDraft('variables_schema', {
        ...draft.variables_schema,
        properties: newProps
    });
  };

  const handleDeleteVariable = (key: string) => {
    const newProps = { ...variables };
    delete newProps[key];

    updateDraft('variables_schema', {
        ...draft.variables_schema,
        properties: newProps
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Variables</h3>
        <Button size="sm" variant="outline" onClick={handleAddVariable} className="h-8">
          <Plus className="h-3.5 w-3.5 mr-2" />
          Add Variable
        </Button>
      </div>

      <div className="space-y-4">
        {Object.entries(variables).map(([key, schema]: [string, any]) => (
          <div key={key} className="relative flex flex-col gap-4 p-4 border rounded-lg bg-card/50 hover:bg-card transition-colors">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => handleDeleteVariable(key)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            <div className="grid grid-cols-2 gap-4 pr-6">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                <Input
                  value={key}
                  onChange={(e) => handleUpdateVariable(key, e.target.value, schema.type)}
                  className="h-8 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                <Select
                  value={schema.type}
                  onValueChange={(val) => handleUpdateVariable(key, key, val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Test Value</Label>
              <Input
                value={testVariables[key] || ''}
                onChange={(e) => setTestVariable(key, e.target.value)}
                placeholder={`Enter ${schema.type} value...`}
                className="h-8 text-xs"
              />
            </div>
          </div>
        ))}
        
        {Object.keys(variables).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
            <p className="text-sm text-muted-foreground mb-2">No variables defined</p>
            <Button variant="ghost" size="sm" onClick={handleAddVariable}>
              Add your first variable
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
