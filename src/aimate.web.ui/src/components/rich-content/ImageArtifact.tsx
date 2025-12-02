/**
 * Image Artifact Component
 *
 * Renders images with zoom, pan, download, and fullscreen capabilities.
 * Supports URLs, data URIs, and base64 encoded images.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Download,
  Brain,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { ImageArtifactData, ArtifactProps } from "./types";

export function ImageArtifact({
  data,
  onSaveToKnowledge,
  collapsed: initialCollapsed = false,
}: ArtifactProps<ImageArtifactData>) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Detect image type from src
  const getImageInfo = useCallback(() => {
    const src = data.src;
    if (src.startsWith('data:image/')) {
      const match = src.match(/data:image\/(\w+)/);
      const format = match ? match[1].toUpperCase() : 'Unknown';
      return { format, isDataUri: true };
    }
    const ext = src.split('.').pop()?.split('?')[0]?.toUpperCase() || 'Unknown';
    return { format: ext, isDataUri: false };
  }, [data.src]);

  const imageInfo = getImageInfo();

  // Handle zoom
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.25, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.25, 0.25));
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Handle rotation
  const handleRotate = () => setRotation(r => (r + 90) % 360);

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  };

  // Handle image load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
    setImageError(false);
  };

  // Handle copy
  const handleCopy = async () => {
    try {
      if (data.src.startsWith('data:')) {
        // Copy data URI
        await navigator.clipboard.writeText(data.src);
      } else {
        // Copy URL
        await navigator.clipboard.writeText(data.src);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Handle download
  const handleDownload = async () => {
    try {
      let blob: Blob;
      let filename = data.alt || 'image';

      if (data.src.startsWith('data:')) {
        // Convert data URI to blob
        const response = await fetch(data.src);
        blob = await response.blob();
        const ext = blob.type.split('/')[1] || 'png';
        filename = `${filename}.${ext}`;
      } else {
        // Fetch the image
        const response = await fetch(data.src);
        blob = await response.blob();
        const urlParts = data.src.split('/');
        filename = urlParts[urlParts.length - 1].split('?')[0] || `${filename}.png`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      toast.error("Failed to download image");
    }
  };

  const handleSaveToKnowledge = () => {
    onSaveToKnowledge?.(data);
    toast.success("Saved to Knowledge");
  };

  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 my-2 overflow-hidden ${fullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-gray-900 flex flex-col' : 'max-w-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          <span className="text-sm font-medium">
            {data.title || data.alt || 'Image'}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {imageInfo.format}
          </Badge>
          {imageLoaded && (
            <span className="text-xs text-gray-400">
              {naturalSize.width} × {naturalSize.height}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isExpanded && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleZoomOut}
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-gray-500 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleZoomIn}
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleRotate}
                title="Rotate"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleResetView}
                title="Reset view"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleCopy}
            title="Copy URL"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          {onSaveToKnowledge && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleSaveToKnowledge}
              title="Save to Knowledge"
            >
              <Brain className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Image content */}
      {isExpanded && (
        <div
          ref={containerRef}
          className={`relative overflow-hidden bg-[#1a1a1a] flex items-center justify-center ${fullscreen ? 'flex-1' : 'max-h-[500px]'} ${zoom > 1 ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{
            minHeight: fullscreen ? undefined : '200px',
            backgroundImage: 'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {imageError ? (
            <div className="text-gray-400 text-sm p-4 text-center">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Failed to load image</p>
              <p className="text-xs mt-1 text-gray-500 break-all max-w-md">
                {data.src.substring(0, 100)}...
              </p>
            </div>
          ) : (
            <img
              ref={imageRef}
              src={data.src}
              alt={data.alt || 'Image'}
              className="max-w-full max-h-full object-contain transition-transform duration-100"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                width: data.width ? `${data.width}px` : undefined,
                height: data.height ? `${data.height}px` : undefined,
              }}
              onLoad={handleImageLoad}
              onError={() => setImageError(true)}
              draggable={false}
            />
          )}

          {/* Zoom indicator when zoomed */}
          {zoom > 1 && (
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Move className="h-3 w-3" />
              Drag to pan
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageArtifact;
