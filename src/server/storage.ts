import path from "node:path";

import {
  LocalStorageService,
  SupabaseEdgeUploadStorageService,
  SupabaseStorageService,
  type StorageService,
} from "@/modules/storage/storage-service";

import { env } from "./env";

function createStorage(): StorageService {
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    return new SupabaseStorageService(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }
  if (env.SUPABASE_URL && env.SUPABASE_MEDIA_UPLOAD_SECRET) {
    return new SupabaseEdgeUploadStorageService(
      env.SUPABASE_URL,
      env.SUPABASE_MEDIA_UPLOAD_SECRET,
    );
  }
  return new LocalStorageService(
    path.resolve(process.cwd(), env.UPLOAD_DIR ?? "data/uploads"),
  );
}

export const storage = createStorage();
