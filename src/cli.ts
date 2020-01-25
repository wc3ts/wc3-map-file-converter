#!/usr/bin/env node

import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import {  info, unit, camera, region, sound, trigger, triggerData } from '.';

interface Reader {
    read: (buff: Buffer, ...args: any[]) => {} | [];
    input: string,
    output: string,
    args?: any[]
}

const mapDir = process.argv[2];
const outDir = process.argv[3];

const readers: Reader[] = [
    {
        read: info.read,
        input: 'war3map.w3i',
        output: 'info.json'
    },
    {
        read: unit.read,
        input: 'war3mapUnits.doo',
        output: 'units.json'
    },
    {
        read: camera.read,
        input: 'war3map.w3c',
        output: 'cameras.json'
    },
    {
        read: region.read,
        input: 'war3map.w3r',
        output: 'regions.json'
    },
    {
        read: sound.read,
        input: 'war3map.w3s',
        output: 'sounds.json'
    },
    {
        read: trigger.read,
        input: 'war3map.wtg',
        output: 'triggers.json',
        args: [triggerData.read(readFileSync('TriggerData.txt'))]
    }
];

mkdirSync(outDir, { recursive: true });

for (const reader of readers) {
    const path = join(mapDir, reader.input);
    if (existsSync(path)) {
        const args = reader.args ? reader.args : [];
        const data = reader.read(readFileSync(path), ...args);
        writeFileSync(join(outDir, reader.output), JSON.stringify(data, null, 4));
    }
}
