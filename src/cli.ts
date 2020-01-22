#!/usr/bin/env node

import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { info, unit, camera, region, sound } from '.';

const mapDir = process.argv[2];
const outDir = process.argv[3];

const files = [
    {
        reader: info,
        input: 'war3map.w3i',
        output: 'info.json'
    },
    {
        reader: unit,
        input: 'war3mapUnits.doo',
        output: 'units.json'
    },
    {
        reader: camera,
        input: 'war3map.w3c',
        output: 'cameras.json'
    },
    {
        reader: region,
        input: 'war3map.w3r',
        output: 'regions.json'
    },
    {
        reader: sound,
        input: 'war3map.w3s',
        output: 'sounds.json'
    }
];

for (const file of files) {
    const path = join(mapDir, file.input);
    if (existsSync(path)) {
        const data = file.reader.read(readFileSync(path));
        writeFileSync(join(outDir, file.output), JSON.stringify(data, null, 4));
    }
}
