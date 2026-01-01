import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];
const educations = ['High School', 'Bachelor\'s', 'Master\'s', 'PhD', 'MBBS', 'MBA', 'B.Tech', 'Other'];
const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Other'];

interface FilterSheetProps {
  onApply?: (filters: any) => void;
}

export function FilterSheet({ onApply }: FilterSheetProps) {
  const [ageRange, setAgeRange] = useState([21, 35]);
  const [selectedReligions, setSelectedReligions] = useState<string[]>([]);
  const [selectedEducations, setSelectedEducations] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const toggleSelection = (item: string, list: string[], setList: (items: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleApply = () => {
    onApply?.({
      ageRange,
      religions: selectedReligions,
      educations: selectedEducations,
      locations: selectedLocations,
    });
    setOpen(false);
  };

  const handleReset = () => {
    setAgeRange([21, 35]);
    setSelectedReligions([]);
    setSelectedEducations([]);
    setSelectedLocations([]);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="glass" size="icon" className="rounded-full">
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-background/95 backdrop-blur-xl border-white/10 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground font-display">Filter Preferences</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-8">
          {/* Age Range */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-foreground">Age Range</h4>
              <span className="text-sm text-primary font-semibold">
                {ageRange[0]} - {ageRange[1]} years
              </span>
            </div>
            <Slider
              value={ageRange}
              onValueChange={setAgeRange}
              min={18}
              max={60}
              step={1}
              className="w-full"
            />
          </div>

          {/* Religion */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Religion</h4>
            <div className="flex flex-wrap gap-2">
              {religions.map((religion) => (
                <Badge
                  key={religion}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedReligions.includes(religion)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                  onClick={() => toggleSelection(religion, selectedReligions, setSelectedReligions)}
                >
                  {religion}
                  {selectedReligions.includes(religion) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Education</h4>
            <div className="flex flex-wrap gap-2">
              {educations.map((edu) => (
                <Badge
                  key={edu}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedEducations.includes(edu)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                  onClick={() => toggleSelection(edu, selectedEducations, setSelectedEducations)}
                >
                  {edu}
                  {selectedEducations.includes(edu) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Location</h4>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <Badge
                  key={loc}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedLocations.includes(loc)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                  onClick={() => toggleSelection(loc, selectedLocations, setSelectedLocations)}
                >
                  {loc}
                  {selectedLocations.includes(loc) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="gradient" className="flex-1" onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
