export interface Comment {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export class CommentManager {
  private comments: Map<string, Comment> = new Map();

  public createComment(content: string): Comment {
    const id = crypto.randomUUID();
    const timestamp = Date.now();

    const comment: Comment = {
      id,
      content,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.comments.set(id, comment);
    return comment;
  }

  public getComment(id: string): Comment | undefined {
    return this.comments.get(id);
  }

  public updateComment(id: string, content: string): void {
    const comment = this.comments.get(id);
    if (comment) {
      comment.content = content;
      comment.updatedAt = Date.now();
    }
  }

  public deleteComment(id: string): void {
    this.comments.delete(id);
  }

  public getAllComments(): Comment[] {
    return Array.from(this.comments.values());
  }
}
