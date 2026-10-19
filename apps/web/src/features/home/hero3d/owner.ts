import type { BufferGeometry, Material, Texture } from "three";

/** Collects every GPU-backed object a scene creates so one call frees them all. */
export class Owner {
  private readonly items: { dispose(): void }[] = [];

  geometry<T extends BufferGeometry>(geometry: T): T {
    this.items.push(geometry);
    return geometry;
  }

  material<T extends Material>(material: T): T {
    this.items.push(material);
    return material;
  }

  texture<T extends Texture>(texture: T): T {
    this.items.push(texture);
    return texture;
  }

  dispose(): void {
    for (const item of this.items) item.dispose();
    this.items.length = 0;
  }
}
