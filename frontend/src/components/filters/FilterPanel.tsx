import { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FilterConditionRow } from './FilterConditionRow';
import { useFilterStore } from '@/stores/useFilterStore';
import type { FilterGroup, FilterCondition, FilterPreset } from '@/types/filters';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

interface FilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function FilterPanel({ open, onOpenChange, projectId }: FilterPanelProps) {
  const {
    getActiveFilters,
    setActiveFilters,
    addFilterGroup,
    removeFilterGroup,
    updateFilterCondition,
    addConditionToGroup,
    removeConditionFromGroup,
    clearActiveFilters,
    savePreset,
    getPresets,
  } = useFilterStore();

  const [savePresetName, setSavePresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const activeFilters = getActiveFilters(projectId);

  const handleAddGroup = () => {
    const newGroup: FilterGroup = {
      id: nanoid(),
      logic: 'AND',
      conditions: [],
    };
    addFilterGroup(projectId, newGroup);
  };

  const handleAddCondition = (groupId: string) => {
    const newCondition: FilterCondition = {
      id: nanoid(),
      field: 'title',
      operator: 'contains',
      value: '',
    };
    addConditionToGroup(projectId, groupId, newCondition);
  };

  const handleUpdateCondition = (
    groupId: string,
    conditionId: string,
    updates: Partial<FilterCondition>
  ) => {
    updateFilterCondition(projectId, groupId, conditionId, updates);
  };

  const handleRemoveCondition = (groupId: string, conditionId: string) => {
    removeConditionFromGroup(projectId, groupId, conditionId);
  };

  const handleRemoveGroup = (groupId: string) => {
    removeFilterGroup(projectId, groupId);
  };

  const handleUpdateGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    const updatedGroups = activeFilters.map((group) =>
      group.id === groupId ? { ...group, logic } : group
    );
    setActiveFilters(projectId, updatedGroups);
  };

  const handleClearFilters = () => {
    clearActiveFilters(projectId);
    toast.success('Filters cleared');
  };

  const handleSavePreset = () => {
    if (!savePresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const preset: FilterPreset = {
      id: nanoid(),
      name: savePresetName.trim(),
      projectId,
      groups: activeFilters,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    savePreset(preset);
    toast.success(`Filter preset "${savePresetName}" saved`);
    setSavePresetName('');
    setShowSavePreset(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Tasks</SheetTitle>
          <SheetDescription>
            Create advanced filters to find specific tasks
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Filter Groups */}
          {activeFilters.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No filters active</p>
              <Button onClick={handleAddGroup} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Filter Group
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeFilters.map((group, groupIndex) => (
                <div key={group.id} className="border rounded-lg p-4 space-y-3">
                  {/* Group Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">
                        Group {groupIndex + 1}
                      </Label>
                      <Select
                        value={group.logic}
                        onValueChange={(value) =>
                          handleUpdateGroupLogic(group.id, value as 'AND' | 'OR')
                        }
                      >
                        <SelectTrigger className="w-[80px] h-7">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveGroup(group.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Conditions */}
                  <div className="space-y-2">
                    {group.conditions.map((condition) => (
                      <FilterConditionRow
                        key={condition.id}
                        condition={condition}
                        onUpdate={(updates) =>
                          handleUpdateCondition(group.id, condition.id, updates)
                        }
                        onRemove={() => handleRemoveCondition(group.id, condition.id)}
                      />
                    ))}
                  </div>

                  {/* Add Condition Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCondition(group.id)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>
              ))}

              {/* Add Group Button */}
              <Button
                variant="outline"
                onClick={handleAddGroup}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Filter Group
              </Button>
            </div>
          )}

          {/* Actions */}
          {activeFilters.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                {/* Save Preset */}
                {!showSavePreset ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowSavePreset(true)}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Preset
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Preset name..."
                      value={savePresetName}
                      onChange={(e) => setSavePresetName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSavePreset();
                        } else if (e.key === 'Escape') {
                          setShowSavePreset(false);
                          setSavePresetName('');
                        }
                      }}
                      autoFocus
                    />
                    <Button onClick={handleSavePreset} size="sm">
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setShowSavePreset(false);
                        setSavePresetName('');
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Clear Filters */}
                <Button
                  variant="destructive"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}