"use client";

import { useReducer } from "react";
import type { ReactNode } from "react";

import { SceneImage } from "./art";
import { nextImageStatus, shouldMountImage, showsPlaceholder } from "./images";
import type { ImageBox } from "./images";

/**
 * Draws `placeholder` until the image at `url` has loaded, then the image.
 * The image sits in a fixed box in scene units, so nothing moves when it
 * arrives, and it stays on the placeholder if it fails. Give it `key={url}`
 * so a new URL starts over. Nothing is fetched until `nearViewport`.
 */
export function LoadableImage({
  url,
  box,
  fit,
  nearViewport,
  placeholder,
}: {
  url: string;
  box: ImageBox;
  fit?: "none" | "meet";
  nearViewport: boolean;
  placeholder: ReactNode;
}) {
  const [status, dispatch] = useReducer(nextImageStatus, "pending");
  return (
    <>
      {showsPlaceholder(status) ? placeholder : null}
      {shouldMountImage(status, nearViewport) ? (
        <SceneImage
          url={url}
          box={box}
          {...(fit ? { fit } : {})}
          hidden={status !== "loaded"}
          onLoad={() => dispatch("load")}
          onError={() => dispatch("error")}
        />
      ) : null}
    </>
  );
}
