export type HeroActionRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type HeroActionCapsuleGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const heroActionCapsuleGeometry = (
  container: HeroActionRect,
  target: HeroActionRect,
): HeroActionCapsuleGeometry => ({
  x: target.left - container.left,
  y: target.top - container.top,
  width: target.width,
  height: target.height,
});
