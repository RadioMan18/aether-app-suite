import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pngToIco from 'png-to-ico';
import png2icons from 'png2icons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceImage = path.join(__dirname, '../nidus_icon.png');
const iconsDir = path.join(__dirname, '../src-tauri/icons');

// PNG icon sizes
const pngSizes = [
  { size: 32, name: '32x32.png' },
  { size: 64, name: '64x64.png' },
  { size: 128, name: '128x128.png' },
  { size: 256, name: '128x128@2x.png' },
  { size: 512, name: 'icon.png' },
];

// Square logo sizes
const squareSizes = [
  { size: 30, name: 'Square30x30Logo.png' },
  { size: 44, name: 'Square44x44Logo.png' },
  { size: 71, name: 'Square71x71Logo.png' },
  { size: 89, name: 'Square89x89Logo.png' },
  { size: 107, name: 'Square107x107Logo.png' },
  { size: 142, name: 'Square142x142Logo.png' },
  { size: 150, name: 'Square150x150Logo.png' },
  { size: 284, name: 'Square284x284Logo.png' },
  { size: 310, name: 'Square310x310Logo.png' },
  { size: 50, name: 'StoreLogo.png' },
];

// Android icon sizes
const androidSizes = [
  { size: 36, name: 'android/mipmap-mdpi/ic_launcher.png' },
  { size: 48, name: 'android/mipmap-hdpi/ic_launcher.png' },
  { size: 72, name: 'android/mipmap-xhdpi/ic_launcher.png' },
  { size: 96, name: 'android/mipmap-xxhdpi/ic_launcher.png' },
  { size: 144, name: 'android/mipmap-xxxhdpi/ic_launcher.png' },
];

// iOS icon sizes
const iosSizes = [
  { size: 40, name: 'ios/40.png' },
  { size: 60, name: 'ios/60.png' },
  { size: 58, name: 'ios/58.png' },
  { size: 87, name: 'ios/87.png' },
  { size: 80, name: 'ios/80.png' },
  { size: 120, name: 'ios/120.png' },
  { size: 180, name: 'ios/180.png' },
];

async function generateIcon(size, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await sharp(sourceImage)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${outputPath}`);
}

async function generateICO(sizes, outputPath) {
  const images = await Promise.all(
    sizes.map(async (size) => {
      return await sharp(sourceImage)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .png()
        .toBuffer();
    })
  );

  try {
    const icoBuffer = await pngToIco(images);
    fs.writeFileSync(outputPath, icoBuffer);
    console.log(`Generated: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating ICO: ${error.message}`);
    await sharp(sourceImage)
      .resize(256, 256, {
        fit: 'cover',
        position: 'center',
      })
      .toFile(outputPath.replace('.ico', '.png'));
    console.log(`Generated PNG fallback: ${outputPath.replace('.ico', '.png')}`);
  }
}

async function generateICNS(outputPath) {
  try {
    const tempPng = path.join(iconsDir, 'temp_icns_source.png');
    await sharp(sourceImage)
      .resize(1024, 1024, {
        fit: 'cover',
        position: 'center',
      })
      .png()
      .toFile(tempPng);

    const pngBuffer = fs.readFileSync(tempPng);
    const icnsBuffer = png2icons.createICNS(pngBuffer);
    fs.writeFileSync(outputPath, icnsBuffer);
    fs.unlinkSync(tempPng);

    console.log(`Generated: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating ICNS: ${error.message}`);
  }
}

async function main() {
  console.log('Starting icon generation...');
  console.log(`Source image: ${sourceImage}`);

  if (!fs.existsSync(sourceImage)) {
    console.error(`Source image not found: ${sourceImage}`);
    process.exit(1);
  }

  console.log('\nGenerating PNG icons...');
  for (const { size, name } of pngSizes) {
    await generateIcon(size, path.join(iconsDir, name));
  }

  console.log('\nGenerating square logos...');
  for (const { size, name } of squareSizes) {
    await generateIcon(size, path.join(iconsDir, name));
  }

  console.log('\nGenerating Android icons...');
  for (const { size, name } of androidSizes) {
    await generateIcon(size, path.join(iconsDir, name));
  }

  console.log('\nGenerating iOS icons...');
  for (const { size, name } of iosSizes) {
    await generateIcon(size, path.join(iconsDir, name));
  }

  console.log('\nGenerating ICO files...');
  await generateICO([16, 32, 48, 64, 128, 256], path.join(iconsDir, 'icon.ico'));

  console.log('\nGenerating ICNS file...');
  await generateICNS(path.join(iconsDir, 'icon.icns'));

  console.log('\nIcon generation complete!');
}

main().catch(console.error);
