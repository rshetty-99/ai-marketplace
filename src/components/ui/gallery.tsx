/**
 * Gallery Component
 * Responsive image gallery with lightbox functionality
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  ZoomIn,
  X,
  Eye,
  Calendar,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image: string;
  category?: string;
  tags?: string[];
  date?: string;
  featured?: boolean;
  link?: string;
  type?: 'image' | 'video' | 'website';
}

interface GalleryProps {
  items: GalleryItem[];
  columns?: 1 | 2 | 3 | 4;
  showFilters?: boolean;
  showMetadata?: boolean;
  className?: string;
}

export function Gallery({ 
  items, 
  columns = 3, 
  showFilters = true, 
  showMetadata = true,
  className 
}: GalleryProps) {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  const categories = ['all', ...Array.from(new Set(items.map(item => item.category).filter(Boolean)))];
  
  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const openLightbox = (item: GalleryItem, index: number) => {
    setSelectedItem(item);
    setLightboxIndex(index);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const currentIndex = filteredItems.findIndex(item => item.id === selectedItem?.id);
    if (direction === 'prev') {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredItems.length - 1;
      setSelectedItem(filteredItems[prevIndex]);
      setLightboxIndex(prevIndex);
    } else {
      const nextIndex = currentIndex < filteredItems.length - 1 ? currentIndex + 1 : 0;
      setSelectedItem(filteredItems[nextIndex]);
      setLightboxIndex(nextIndex);
    }
  };

  const getColumnClass = () => {
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      {showFilters && categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* Gallery Grid */}
      <div className={cn("grid gap-6", getColumnClass())}>
        {filteredItems.map((item, index) => (
          <GalleryCard
            key={item.id}
            item={item}
            index={index}
            showMetadata={showMetadata}
            onImageClick={() => openLightbox(item, index)}
          />
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
          {selectedItem && (
            <div className="relative w-full h-full bg-black">
              {/* Navigation */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                {selectedItem.link && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(selectedItem.link, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedItem(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Image */}
              <div className="relative w-full h-3/4">
                <Image
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Navigation Arrows */}
              {filteredItems.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                    onClick={() => navigateLightbox('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                    onClick={() => navigateLightbox('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Info Panel */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                <div className="max-w-2xl">
                  <h3 className="text-xl font-semibold mb-2">{selectedItem.title}</h3>
                  {selectedItem.description && (
                    <p className="text-gray-300 mb-3">{selectedItem.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.category && (
                      <Badge variant="secondary">{selectedItem.category}</Badge>
                    )}
                    {selectedItem.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-white border-white/30">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface GalleryCardProps {
  item: GalleryItem;
  index: number;
  showMetadata: boolean;
  onImageClick: () => void;
}

function GalleryCard({ item, index, showMetadata, onImageClick }: GalleryCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={onImageClick}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              {item.link && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(item.link, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Featured Badge */}
        {item.featured && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-yellow-900">
            Featured
          </Badge>
        )}
      </div>

      {/* Metadata */}
      {showMetadata && (
        <CardContent className="p-4">
          <h3 className="font-semibold mb-1 line-clamp-1">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {item.category && (
                <Badge variant="secondary" className="text-xs">
                  {item.category}
                </Badge>
              )}
            </div>
            
            {item.date && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {item.date}
              </div>
            )}
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Masonry Layout Version
export function MasonryGallery({ items, showFilters = true, className }: Omit<GalleryProps, 'columns'>) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const categories = ['all', ...Array.from(new Set(items.map(item => item.category).filter(Boolean)))];
  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      {showFilters && categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* Masonry Grid */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {filteredItems.map((item, index) => (
          <div key={item.id} className="break-inside-avoid">
            <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover transition-transform group-hover:scale-105"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>

                {item.featured && (
                  <Badge className="absolute top-2 right-2 bg-yellow-500 text-yellow-900">
                    Featured
                  </Badge>
                )}
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold mb-1">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                )}
                
                <div className="flex flex-wrap gap-1">
                  {item.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}