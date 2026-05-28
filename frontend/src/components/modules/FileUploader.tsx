'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Image, Film, File, CheckCircle2 } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';

interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  label?: string;
  hint?: string;
  className?: string;
}

function getFileIcon(file: File) {
  if (file.type.startsWith('image/')) return <Image className="w-4 h-4 text-indigo-400" />;
  if (file.type.startsWith('video/')) return <Film className="w-4 h-4 text-purple-400" />;
  if (file.type === 'application/pdf') return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

export function FileUploader({
  onFilesChange,
  accept,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024,
  label = 'Arraste arquivos ou clique para selecionar',
  hint = 'Suporta imagens, vídeos e documentos (máx. 50MB por arquivo)',
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      const withId = accepted.map(f => Object.assign(f, { id: Math.random().toString(36).slice(2) }));
      const updated = [...files, ...withId].slice(0, maxFiles);
      setFiles(updated);
      onFilesChange(updated);

      if (rejected.length > 0) {
        setErrors(rejected.map(r => `${r.file.name}: ${r.errors.map((e: any) => e.message).join(', ')}`));
        setTimeout(() => setErrors([]), 4000);
      }
    },
    [files, maxFiles, onFilesChange]
  );

  const removeFile = (id: string) => {
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    onFilesChange(updated);
  };

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
  });

  return (
    <div className={cn('space-y-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
          isDragAccept && 'border-emerald-500 bg-emerald-500/5',
          isDragReject && 'border-red-500 bg-red-500/5',
          isDragActive && !isDragAccept && !isDragReject && 'border-primary/60 bg-primary/5',
          !isDragActive && 'border-border hover:border-primary/40 hover:bg-muted/30'
        )}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ scale: isDragActive ? 1.05 : 1 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col items-center gap-2"
        >
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isDragAccept ? 'bg-emerald-500/10' : isDragReject ? 'bg-red-500/10' : 'bg-muted'
          )}>
            {isDragAccept ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Upload className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
          </div>
          {maxFiles > 1 && (
            <p className="text-[10px] text-muted-foreground/60">
              {files.length}/{maxFiles} arquivos selecionados
            </p>
          )}
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {errors.map((err, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400 bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/20"
          >
            {err}
          </motion.p>
        ))}
      </AnimatePresence>

      {files.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {files.map(file => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 px-3 py-2.5 bg-muted/40 border border-border rounded-lg"
              >
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
