import type { CommentAnchor, CommentThread } from './protocol.ts';

export function createCommentThread(
  authorId: string,
  body: string,
  anchor: CommentAnchor
): CommentThread {
  return {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    body,
    authorId,
    anchor,
    createdAt: Date.now(),
  };
}

export type CommentsState = {
  threads: CommentThread[];
  add: (thread: CommentThread) => void;
  resolve: (id: string) => void;
  remove: (id: string) => void;
  list: () => CommentThread[];
};

export function createCommentsState(): CommentsState {
  let threads: CommentThread[] = [];
  return {
    get threads() {
      return threads;
    },
    add(thread) {
      threads = [...threads.filter((t) => t.id !== thread.id), thread];
    },
    resolve(id) {
      threads = threads.map((t) => (t.id === id ? { ...t, resolved: true } : t));
    },
    remove(id) {
      threads = threads.filter((t) => t.id !== id);
    },
    list: () => threads.slice(),
  };
}
