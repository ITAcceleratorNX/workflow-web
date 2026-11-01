import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { MOBILE_REQUESTS_COMMENTS_SHEET } from "@/constants/mobile-requests-ui";
import { cn } from "@/lib/utils";
import { CommentList, Comment } from "@/components/comment/Comment";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCommentsStore } from "@/stores/useCommentsStore";

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number | null;
  currentUserId?: number | null;
  isDesktop?: boolean;
  variant?: "default" | "admin";
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  requestId,
  currentUserId = null,
  isDesktop = false,
  variant = "default",
}) => {
  const { user } = useAuthStore();
  const {
    comments,
    loading,
    initialized,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
    resetComments
  } = useCommentsStore();

  const [comment, setComment] = useState("");
  const [editCommentId, setEditCommentId] = useState<number | null>(null);

  // Загрузка комментариев только при первом открытии модального окна
  useEffect(() => {
    if (isOpen && requestId && !initialized[requestId]) {
      fetchComments(requestId);
    }
  }, [isOpen, requestId, initialized, fetchComments]);

  // Сброс состояния при закрытии
  useEffect(() => {
    if (!isOpen) {
      setComment("");
      setEditCommentId(null);
    }
  }, [isOpen]);

  const handleDelete = async (id: number) => {
    if (!requestId) return;
    
    try {
      await deleteComment(requestId, id);
    } catch (err) {
      console.error("Ошибка при удалении комментария:", err);
    }
  };

  const handleSend = async (subRequestId: number) => {
    if (comment.trim() === "") return;

    if (editCommentId) {
      // Редактирование комментария
      try {
        await updateComment(subRequestId, editCommentId, comment.trim());
        setComment("");
        setEditCommentId(null);
      } catch (error) {
        console.error("Ошибка при редактировании комментария:", error);
      }
    } else {
      // Создание нового комментария
      try {
        await addComment(subRequestId, comment.trim(), user);
        setComment("");
      } catch (error) {
        console.error("Ошибка при отправке комментария:", error);
      }
    }
  };

  const handleEdit = (id: number, oldComment: string) => {
    setComment(oldComment);
    setEditCommentId(id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && requestId) {
      e.preventDefault();
      handleSend(requestId);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  if (!isOpen || !requestId) return null;

  const commentsBody = (listVariant: "dark" | "default") => (
    <>
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {loading[requestId || 0] ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Загрузка комментариев...</p>
          </div>
        ) : (comments[requestId || 0] || []).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Комментариев пока нет</p>
          </div>
        ) : (
          <CommentList
            comments={comments[requestId || 0] || []}
            currentUserId={currentUserId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            variant={listVariant === "dark" ? "dark" : undefined}
          />
        )}
      </div>
      <div className="p-4 pt-3 border-t border-border bg-surface pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex flex-col gap-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyPress={handleKeyPress}
            onInput={handleInput}
            placeholder="Написать комментарий..."
            className="w-full min-h-[44px] max-h-[120px] p-3 rounded-xl text-sm bg-surface-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            style={{
              height: "auto",
              minHeight: "44px",
              maxHeight: "120px",
            }}
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => handleSend(requestId)}
              disabled={!comment.trim()}
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Отправить
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // Desktop: одна тёмная правая панель для всех ролей.
  if (isDesktop) {
    return (
      <div className="flex flex-col bg-desktop-bg fixed top-0 right-0 h-full w-[400px] max-w-[100vw] shadow-2xl border-l border-white/10 z-[110]">
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h3 className="font-semibold text-lg text-white">Комментарии</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {commentsBody("dark")}
      </div>
    );
  }

  if (variant === "admin") {
    return (
      <div className="fixed inset-0 z-[110] flex items-end">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div
          className={cn(
            "relative w-full max-h-[85vh] min-h-[50vh] rounded-t-3xl flex flex-col shadow-2xl",
            MOBILE_REQUESTS_COMMENTS_SHEET,
          )}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border flex-shrink-0">
            <h3 className="font-semibold text-lg text-foreground">Комментарии</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-muted-foreground transition-colors"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {commentsBody("dark")}
        </div>
      </div>
    );
  }

  // Mobile (default): шторка снизу.
  return (
    <div className="fixed inset-0 z-[110] flex items-end safe-area-bottom">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative w-full max-h-[85vh] min-h-[50vh] rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-8",
          MOBILE_REQUESTS_COMMENTS_SHEET,
        )}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3 border-b border-border flex-shrink-0">
          <h3 className="font-semibold text-lg text-foreground">Комментарии</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        {commentsBody("default")}
      </div>
    </div>
  );
};
