import Dexie, { type Table } from "dexie";

export interface BookRecord {
  id?: number;
  name: string;
  data: ArrayBuffer;
  format: "epub" | "txt" | "pdf";
  lastRead: number;
  metadata?: {
    title?: string;
    author?: string;
    cover?: string | Blob;
  };
}

export class PageeDatabase extends Dexie {
  books!: Table<BookRecord>;

  constructor() {
    super("PageeDB");
    this.version(1).stores({
      books: "++id, name, format, lastRead",
    });
  }
}

export const db = new PageeDatabase();
