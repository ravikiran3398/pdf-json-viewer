import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext.js';

interface PdfViewerProps {
  url?: string;
  fileName?: string;
  pageCount?: number;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, fileName, pageCount = 1 }) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Viewer Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 text-sm">
        <div className="flex items-center space-x-2 truncate max-w-[45%]">
          <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <span className="font-medium text-slate-200 truncate">{fileName || 'Document.pdf'}</span>
        </div>

        {/* Page navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
            title={t('pdf.prev', 'Previous Page')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-300 font-mono">
            {currentPage} / {pageCount || 1}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount || 1))}
            disabled={currentPage >= (pageCount || 1)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
            title={t('pdf.next', 'Next Page')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={t('pdf.zoomOut', 'Zoom Out')}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 font-mono w-10 text-center">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={t('pdf.zoomIn', 'Zoom In')}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            onClick={handleRotate}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title={t('pdf.rotate', 'Rotate')}
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/40 relative">
        {url ? (
          <div
            className="transition-transform duration-200 origin-center bg-white rounded shadow-2xl overflow-hidden w-full h-full min-h-[500px]"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          >
            <iframe
              src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
              title="PDF Viewer"
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 py-20">
            <FileText className="w-16 h-16 text-slate-700 mb-3 animate-pulse" />
            <p className="text-sm font-medium">{t('pdf.unavailable', 'PDF preview loading or unavailable')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
