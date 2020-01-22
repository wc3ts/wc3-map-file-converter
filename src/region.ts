import { RGBA, WarBuffer } from './warbuffer';
import { strict } from 'assert';

export interface Region {
    left: number;
    bottom: number;
    right: number;
    top: number;
    name: string;
    id: number;
    weather?: string;
    ambient: string;
    color: RGBA;
}

export function read(buff: Buffer): Region[] {
    const buffer = new WarBuffer({ buff });
    const version = buffer.readUInt32LE();
    strict.equal(version, 5, 'Unknown regions version');
    const result = buffer.readArray(readRegion);
    strict.equal(buffer.remaining(), 0);
    return result;
}

function readRegion(buffer: WarBuffer): Region {
    const region = {} as Region;
    region.left = buffer.readFloatLE();
    region.bottom = buffer.readFloatLE();
    region.right = buffer.readFloatLE();
    region.top = buffer.readFloatLE();
    region.name = buffer.readStringNT();
    region.id = buffer.readUInt32LE();
    region.weather = buffer.readFourCC();
    region.ambient = buffer.readStringNT();
    region.color = buffer.readRGBA();
    return region;
}
