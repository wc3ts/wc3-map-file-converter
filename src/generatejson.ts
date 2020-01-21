#!/usr/bin/env node

import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { WarBuffer } from './warbuffer';
import { info, unit, camera, region } from '.';

const config = {
    'mapDir': 'map.w3x',
    'outDir': 'src/resources'
};

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
    }
];

for (const file of files) {
    const buffer = new WarBuffer({ buff: readFileSync(join(config.mapDir, file.input)) });
    const data = file.reader.read(buffer);
    writeFileSync(join(config.outDir, file.output), JSON.stringify(data, null, 4));
}
