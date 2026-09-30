import type { DocNode, Operation } from '@codemerge/kernel';

export type RoomRecord = {
  docId: string;
  version: number;
  snapshot: DocNode;
  /** Ops from version 1..version (index 0 = version 1) */
  ops: Operation[];
  updatedAt: number;
};

export type NamedVersion = {
  id: string;
  name: string;
  version: number;
  snapshot: DocNode;
  createdAt: number;
};

export interface CollabStore {
  loadRoom(docId: string): Promise<RoomRecord | null>;
  saveRoom(room: RoomRecord): Promise<void>;
  appendOps(docId: string, ops: Operation[], snapshot: DocNode, newVersion: number): Promise<void>;
  listOpsSince(docId: string, sinceVersion: number): Promise<Operation[]>;
  compactSnapshot(docId: string, keepLastOps?: number): Promise<RoomRecord | null>;
  listVersions?(docId: string): Promise<NamedVersion[]>;
  saveVersion?(docId: string, name: string): Promise<NamedVersion | null>;
  close?(): Promise<void> | void;
}
