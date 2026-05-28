'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { devolutionAPI } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';
import { Send, MessageSquare, Lock, Globe } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  user: { name: string; email: string; role: string };
}

interface CommentSectionProps {
  devolutionId: string;
  comments: Comment[];
  queryKey: string[];
}

export function CommentSection({ devolutionId, comments, queryKey }: CommentSectionProps) {
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { mutate: addComment, isPending } = useMutation({
    mutationFn: (data: { content: string; isInternal: boolean }) =>
      devolutionAPI.addComment(devolutionId, data),
    onSuccess: () => {
      toast.success('Comentário adicionado');
      setContent('');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error('Erro ao adicionar comentário'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment({ content: content.trim(), isInternal });
  };

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {(comments || []).map((comment, idx) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`flex gap-3 ${comment.isInternal ? 'opacity-90' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
              {comment.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`rounded-xl px-4 py-3 text-sm ${
                comment.isInternal
                  ? 'bg-amber-500/5 border border-amber-500/20'
                  : 'bg-muted/50 border border-border'
              }`}>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-medium text-foreground text-xs">{comment.user.name}</span>
                  {comment.isInternal && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                      <Lock className="w-2.5 h-2.5" /> Interno
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {(!comments || comments.length === 0) && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <MessageSquare className="w-9 h-9 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border border-border rounded-xl overflow-hidden">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Escreva um comentário..."
          rows={3}
          className="w-full px-4 py-3 bg-card text-sm text-foreground placeholder-muted-foreground resize-none outline-none focus:ring-0"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as any);
          }}
        />
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-muted/30 border-t border-border">
          <button
            type="button"
            onClick={() => setIsInternal(!isInternal)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
              isInternal
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {isInternal ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
            {isInternal ? 'Nota interna' : 'Público'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground hidden sm:block">⌘+Enter para enviar</span>
            <button
              type="submit"
              disabled={!content.trim() || isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3 h-3" />
              {isPending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
