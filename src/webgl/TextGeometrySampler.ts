import { ParticlePoint, WordName } from '../types';

export class TextGeometrySampler {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 2048;
    this.canvas.height = 1024;
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
  }

  public sampleWordPoints(word: WordName, totalPointsCount: number): ParticlePoint[] {
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.clearRect(0, 0, width, height);

    // Dark background for crisp text
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, width, height);

    // Font styling
    const fontSize = word.length > 6 ? 180 : 230;
    this.ctx.font = `900 ${fontSize}px "Orbitron", "Syne", "Cinzel", "Space Grotesk", sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#FFFFFF';

    const centerX = width / 2;
    const centerY = height / 2;

    // Draw full word first
    this.ctx.fillText(word, centerX, centerY);

    // Sample image data
    const imgData = this.ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Collect valid text pixels
    const validPixels: { x: number; y: number; letterIndex: number }[] = [];

    // Calculate individual letter positions for letterIndex assignment
    const letters = word.split('');
    const letterWidths: number[] = letters.map(char => this.ctx.measureText(char).width);
    const totalWordWidth = this.ctx.measureText(word).width;
    const startX = centerX - totalWordWidth / 2;

    // Calculate bounding boxes for each letter
    const letterBounds: { startX: number; endX: number }[] = [];
    let currentX = startX;
    letterWidths.forEach(w => {
      letterBounds.push({
        startX: currentX - 10,
        endX: currentX + w + 10,
      });
      currentX += w;
    });

    // Step size for sampling density
    const step = 2;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        const r = data[index];

        if (alpha > 128 && r > 128) {
          // Determine letter index based on X
          let letterIndex = 0;
          for (let i = 0; i < letterBounds.length; i++) {
            if (x >= letterBounds[i].startX && x <= letterBounds[i].endX) {
              letterIndex = i;
              break;
            }
          }

          validPixels.push({ x, y, letterIndex });
        }
      }
    }

    if (validPixels.length === 0) {
      // Fallback if canvas font didn't load yet
      return this.generateFallbackPoints(totalPointsCount);
    }

    const points: ParticlePoint[] = [];
    const scale = 0.015; // world scale ratio

    for (let i = 0; i < totalPointsCount; i++) {
      // Randomly sample from valid pixels with slight noise for smooth 3D distribution
      const pixel = validPixels[i % validPixels.length];

      // Convert 2D pixel to centered 3D coords
      const worldX = (pixel.x - centerX) * scale;
      const worldY = -(pixel.y - centerY) * scale; // invert Y for Three.js
      
      // Add depth extrusion layer (3D metallic thickness)
      const depthLayer = (Math.random() - 0.5) * 1.2; 
      const worldZ = depthLayer;

      // Calculate surface normal
      const nx = (Math.random() - 0.5) * 0.2;
      const ny = (Math.random() - 0.5) * 0.2;
      const nz = depthLayer > 0 ? 1 : -1;

      points.push({
        x: worldX + (Math.random() - 0.5) * 0.05,
        y: worldY + (Math.random() - 0.5) * 0.05,
        z: worldZ,
        letterIndex: pixel.letterIndex,
        u: pixel.x / width,
        v: pixel.y / height,
        nx,
        ny,
        nz,
      });
    }

    return points;
  }

  private generateFallbackPoints(totalPointsCount: number): ParticlePoint[] {
    const points: ParticlePoint[] = [];
    for (let i = 0; i < totalPointsCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 3;
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: (Math.random() - 0.5) * 2,
        letterIndex: Math.floor(Math.random() * 5),
        u: Math.random(),
        v: Math.random(),
        nx: 0,
        ny: 0,
        nz: 1,
      });
    }
    return points;
  }
}
