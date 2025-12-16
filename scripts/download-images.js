const fs = require('fs');
const path = require('path');
const https = require('https');

const SAMPLE_DATA = {
    woman: {
        original: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop",
        examples: [
            { id: 1, src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=500", prompt: "Professional LinkedIn headshot, suit, studio lighting, confident smile" },
            { id: 2, src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=500", prompt: "Cyberpunk vivid colors, neon lights, futuristic city background" },
            { id: 3, src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=500", prompt: "Vintage 1950s hollywood glamour style, black and white portrait" },
            { id: 4, src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500", prompt: "Ethereal fairy queen, forest background, magical glowing particles" },
            { id: 5, src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500", prompt: "Oil painting style, renaissance era noblewoman" },
            { id: 6, src: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500", prompt: "Minimalist vector art illustration, flat colors" },
            { id: 7, src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500", prompt: "Pixar style 3D character animation render" },
            { id: 8, src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500", prompt: "Watercolor splash art, artistic dreamy portrait" },
            { id: 9, src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500", prompt: "Detailed pencil sketch, charcoal shading" },
        ]
    },
    man: {
        original: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop",
        examples: [
            { id: 1, src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500", prompt: "CEO in modern office, suit, arms crossed, confident" },
            { id: 2, src: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500", prompt: "Viking warrior, rugged beard, fur armor, snowy mountains" },
            { id: 3, src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500", prompt: "Astronaut in sci-fi spacesuit, galaxy background reflected in visor" },
            { id: 4, src: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=500", prompt: "1920s gangster style, fedora hat, noir atmosphere" },
            { id: 5, src: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500", prompt: "Cybernetic cyborg enhancement, glowing red eye, metal skin" },
            { id: 6, src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500", prompt: "Hogwarts wizard student, holding wand, magical library" },
            { id: 7, src: "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=500", prompt: "Claymation style character, stop motion aesthetic" },
            { id: 8, src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500", prompt: "Pop art comic book style, halftone dots, bold outlines" },
            { id: 9, src: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=500", prompt: "Samurai in traditional armor, cherry blossoms falling" },
        ]
    },
    child: {
        original: "https://images.unsplash.com/photo-1472490059022-d5d084f09e5e?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2hpbGQlMjBwb3J0cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
        examples: [
            { id: 1, src: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500", prompt: "Pixar movie protagonist, cute, big eyes, 3D render" },
            { id: 2, src: "https://images.unsplash.com/photo-1676617081201-b922453dcd48?w=500", prompt: "Little prince style, watercolor, planet and stars" },
            { id: 3, src: "https://images.unsplash.com/photo-1497881807663-38b9a95b7192?w=500", prompt: "Superhero kid with cape, flying in the clouds" },
            { id: 4, src: "https://images.unsplash.com/photo-1595760780346-f972eb49709f?w=500", prompt: "Fantasy elf child, pointed ears, magic forest" },
            { id: 5, src: "https://images.unsplash.com/photo-1595280983913-0d2e57a2fc43?w=500", prompt: "Studio Ghibli style, peaceful meadow, fluffy clouds" },
            { id: 6, src: "https://images.unsplash.com/photo-1608734265656-f035d3e7bcbf?w=500", prompt: "LEGO minifigure version of the child" },
            { id: 7, src: "https://images.unsplash.com/photo-1473280025148-643f9b0cbac2?w=500", prompt: "Oil painting, cherub style, classical art" },
            { id: 8, src: "https://images.unsplash.com/photo-1699903905361-4d408679753f?w=500", prompt: "Futuristic space cadet, cute spacesuit" },
            { id: 9, src: "https://images.unsplash.com/photo-1472490059022-d5d084f09e5e?w=500", prompt: "Pencil sketch, cute doodle style" },
        ]
    }
};

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        // Force WebP format by appending or modifying query params
        const urlObj = new URL(url);
        urlObj.searchParams.set('fm', 'webp');
        // Clean up common duplicate params if possible, or just overwrite 'fm'

        const finalUrl = urlObj.toString();
        const file = fs.createWriteStream(filepath);

        https.get(finalUrl, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                file.close();
                fs.unlink(filepath, () => { }); // Delete partial file
                reject(`Server responded with ${response.statusCode}: ${finalUrl}`);
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => { }); // Delete partial file
            reject(err.message);
        });
    });
};

const main = async () => {
    const start = Date.now();
    console.log('Starting download...');

    for (const [category, data] of Object.entries(SAMPLE_DATA)) {
        // Map category name to folder name (child -> baby)
        let folderName = category;
        if (category === 'child') folderName = 'baby';

        const dir = path.join(__dirname, '../public/samples', folderName);
        if (!fs.existsSync(dir)) {
            console.log(`Creating directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }

        // Download Original
        try {
            console.log(`Downloading ${category} original...`);
            await downloadImage(data.original, path.join(dir, 'original.webp'));
        } catch (error) {
            console.error(`Failed to download ${category} original:`, error);
        }

        // Download Examples
        for (const example of data.examples) {
            try {
                console.log(`Downloading ${category} example ${example.id}...`);
                await downloadImage(example.src, path.join(dir, `${example.id}.webp`));
            } catch (error) {
                console.error(`Failed to download ${category} example ${example.id}:`, error);
            }
        }
    }

    console.log(`Download finished in ${(Date.now() - start) / 1000}s`);
};

main();
