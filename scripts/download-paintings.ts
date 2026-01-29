#!/usr/bin/env bun
/**
 * Download expressionist paintings for the Alexa Art Gallery
 * Run with: bun scripts/download-paintings.ts
 * 
 * Uses thumbnail URLs which Wikipedia recommends for bulk downloads
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(import.meta.dir, '../public/assets/paintings');

// Using thumbnail URLs (800-1280px) which are more reliable
const PAINTINGS = [
    // Kandinsky
    { id: 'kandinsky-composition-7', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Vassily_Kandinsky%2C_1913_-_Composition_7.jpg/1280px-Vassily_Kandinsky%2C_1913_-_Composition_7.jpg' },
    { id: 'kandinsky-composition-8', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Vassily_Kandinsky%2C_1923_-_Composition_8%2C_huile_sur_toile%2C_140_cm_x_201_cm%2C_Mus%C3%A9e_Guggenheim%2C_New_York.jpg/1280px-Vassily_Kandinsky%2C_1923_-_Composition_8%2C_huile_sur_toile%2C_140_cm_x_201_cm%2C_Mus%C3%A9e_Guggenheim%2C_New_York.jpg' },
    { id: 'kandinsky-several-circles', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/VasijKandwordsimpr.jpg/800px-VasijKandwordsimpr.jpg' },
    { id: 'kandinsky-yellow-red-blue', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Kandinsky_-_Yellow-Red-Blue.jpg/1280px-Kandinsky_-_Yellow-Red-Blue.jpg' },
    // Picasso
    { id: 'picasso-guernica', url: 'https://upload.wikimedia.org/wikipedia/en/7/74/PicassoGuernica.jpg' },
    { id: 'picasso-demoiselles', url: 'https://upload.wikimedia.org/wikipedia/en/1/1c/Pablo_Picasso%2C_1907%2C_Les_Demoiselles_d%27Avignon%2C_oil_on_canvas%2C_243.9_x_233.7_cm%2C_Museum_of_Modern_Art%2C_New_York.jpg' },
    { id: 'picasso-three-musicians', url: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Les_Trois_Musiciens.jpg' },
    // Munch
    { id: 'munch-scream', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg/800px-Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg' },
    { id: 'munch-madonna', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Edvard_Munch_-_Madonna_%281894-1895%29.jpg/800px-Edvard_Munch_-_Madonna_%281894-1895%29.jpg' },
    // Kirchner
    { id: 'kirchner-berlin-street', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Kirchner_-_Berlin_Street_Scene_-_Google_Art_Project.jpg/800px-Kirchner_-_Berlin_Street_Scene_-_Google_Art_Project.jpg' },
    // Franz Marc
    { id: 'marc-blue-horses', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Franz_Marc_012.jpg/1280px-Franz_Marc_012.jpg' },
    { id: 'marc-yellow-cow', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Franz_Marc_021.jpg/1280px-Franz_Marc_021.jpg' },
    // Paul Klee
    { id: 'klee-senecio', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Klee%2C_Senecio.jpg/800px-Klee%2C_Senecio.jpg' },
    { id: 'klee-twittering-machine', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Klee%2C_The_Twittering_Machine.jpg/800px-Klee%2C_The_Twittering_Machine.jpg' },
    // Kokoschka
    { id: 'kokoschka-bride-of-wind', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Oskar_Kokoschka_Die_Windsbraut.jpg/1280px-Oskar_Kokoschka_Die_Windsbraut.jpg' },
    // Schiele
    { id: 'schiele-self-portrait', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Egon_Schiele_-_Self-Portrait_with_Physalis_-_Google_Art_Project.jpg/800px-Egon_Schiele_-_Self-Portrait_with_Physalis_-_Google_Art_Project.jpg' },
    // Macke
    { id: 'macke-hat-shop', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/August_Macke_-_Hutladen_%28Hat_Shop%29_-_Google_Art_Project.jpg/800px-August_Macke_-_Hutladen_%28Hat_Shop%29_-_Google_Art_Project.jpg' },
    // Nolde
    { id: 'nolde-masks', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Nolde_Masks.jpg/800px-Nolde_Masks.jpg' },
    // De Kooning
    { id: 'dekooning-woman-3', url: 'https://upload.wikimedia.org/wikipedia/en/5/5e/Willem_de_Kooning_Woman_III.jpg' },
    // Beckmann
    { id: 'beckmann-the-night', url: 'https://upload.wikimedia.org/wikipedia/en/6/6a/Max_Beckmann%2C_The_Night.jpg' },
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadPainting(painting: { id: string; url: string }): Promise<boolean> {
    const ext = 'jpg';
    const filename = `${painting.id}.${ext}`;
    const filepath = path.join(OUTPUT_DIR, filename);

    if (existsSync(filepath)) {
        console.log(`⏭️  Skipping ${painting.id} (already exists)`);
        return true;
    }

    try {
        console.log(`⬇️  Downloading ${painting.id}...`);
        const response = await fetch(painting.url, {
            headers: {
                'User-Agent': 'LiquidCrypto Art Gallery/1.0 (https://liquid-os.app; contact@liquid-os.app)',
                'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
        });

        if (!response.ok) {
            console.error(`❌ Failed to download ${painting.id}: ${response.status} ${response.statusText}`);
            return false;
        }

        const buffer = await response.arrayBuffer();
        await writeFile(filepath, Buffer.from(buffer));
        console.log(`✅ Downloaded ${painting.id} (${(buffer.byteLength / 1024).toFixed(0)} KB)`);
        return true;
    } catch (error) {
        console.error(`❌ Error downloading ${painting.id}:`, error);
        return false;
    }
}

async function main() {
    console.log('🎨 Downloading Expressionist Paintings for Art Gallery\n');
    console.log('Using thumbnail URLs with rate limiting to respect Wikipedia...\n');

    // Ensure output directory exists
    if (!existsSync(OUTPUT_DIR)) {
        await mkdir(OUTPUT_DIR, { recursive: true });
    }

    let success = 0;
    let failed = 0;

    for (const painting of PAINTINGS) {
        const result = await downloadPainting(painting);
        if (result) success++;
        else failed++;

        // Rate limit: wait 1.5 seconds between downloads
        await sleep(1500);
    }

    console.log(`\n📊 Results: ${success} succeeded, ${failed} failed`);

    if (failed > 0) {
        console.log('\n⚠️  Some paintings failed to download.');
        console.log('You can manually check the URLs or try again later.');
    }

    console.log('\n📁 Files saved to: public/assets/paintings/');
}

main();
