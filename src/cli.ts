#!/usr/bin/env node

import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as info from "./info";
import * as unit from "./unit";
import * as camera from "./camera";
import * as region from "./region";
import * as sound from "./sound";
import * as trigger from "./trigger";

import { ReaderFunction } from './reader';

interface ReaderInfo {
    reader: ReaderFunction,
    input: string,
    output: string,
}

const mapDir = process.argv[2];
const outDir = process.argv[3];

const files: ReaderInfo[] = [
    {
        reader: info.read,
        input: 'war3map.w3i',
        output: 'info.json'
    },
    {
        reader: unit.read,
        input: 'war3mapUnits.doo',
        output: 'units.json'
    },
    {
        reader: camera.read,
        input: 'war3map.w3c',
        output: 'cameras.json'
    },
    {
        reader: region.read,
        input: 'war3map.w3r',
        output: 'regions.json'
    },
    {
        reader: sound.read,
        input: 'war3map.w3s',
        output: 'sounds.json'
    },
    {
        reader: trigger.read,
        input: 'war3map.wtg',
        output: 'triggers.json'
    }
];

for (const file of files) {
    const path = join(mapDir, file.input);
    if (existsSync(path)) {
        const data = file.reader(readFileSync(path));
        writeFileSync(join(outDir, file.output), JSON.stringify(data, null, 4));
    }
}
