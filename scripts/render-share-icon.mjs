import sharp from 'sharp';

// Keep the existing conference artwork while providing an opaque iOS icon.
await sharp('public/2026/brand/share-2026.png')
  .resize(180, 180)
  .flatten({ background: '#f5f1e8' })
  .png({ compressionLevel: 9 })
  .toFile('public/2026/brand/apple-touch-icon.png');
