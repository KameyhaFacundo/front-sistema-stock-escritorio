import { lazy } from "react";
import { isChunkLoadError, reloadOnceForChunkError } from "./chunkError";

export default function lazyWithRetry(importFn) {
  return lazy(() =>
    importFn().catch((err) => {
      if (isChunkLoadError(err) && reloadOnceForChunkError()) {
        return { default: () => null };
      }
      throw err;
    })
  );
}
