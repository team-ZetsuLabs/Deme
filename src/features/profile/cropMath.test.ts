import { describe, expect, it } from 'vitest';
import { clampOffset, coverScale, sourceRect } from './cropMath';

describe('cropMath', () => {
  it('coverScale couvre le plus petit côté', () => {
    // Image 400x200 dans un viewport 200 : il faut couvrir la hauteur -> 200/200 = 1.
    expect(coverScale(200, 400, 200)).toBe(1);
    // Image 100x400 : couvrir la largeur -> 200/100 = 2.
    expect(coverScale(200, 100, 400)).toBe(2);
    // Garde-fou : dimensions nulles.
    expect(coverScale(200, 0, 0)).toBe(1);
  });

  it('clampOffset empêche tout bord vide (image toujours sous le viewport)', () => {
    // Image affichée 300x300 dans un viewport 200 : offset borné à [-100, 0].
    expect(clampOffset(200, 300, 300, 50, 50)).toEqual({ x: 0, y: 0 });
    expect(clampOffset(200, 300, 300, -500, -500)).toEqual({ x: -100, y: -100 });
    expect(clampOffset(200, 300, 300, -40, -10)).toEqual({ x: -40, y: -10 });
  });

  it('sourceRect convertit le viewport en rectangle de l’image source', () => {
    // scale 2, offset (-100,-100) : on part de 50,50 dans l’image, sur 100 px de côté.
    expect(sourceRect(200, 2, -100, -100)).toEqual({ sx: 50, sy: 50, size: 100 });
  });
});
