const { execSync } = require('child_process');

async function seedArtwork() {
  try {
    console.log('Running artwork seed...');
    execSync('npx medusa exec ./src/scripts/seed-artwork.ts', { stdio: 'inherit' });
    console.log('Artwork seed completed successfully!');
  } catch (error) {
    console.error('Error seeding artwork:', error);
    process.exit(1);
  }
}

seedArtwork();