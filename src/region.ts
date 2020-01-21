import { RGBA, WarBuffer } from './warbuffer';
import { strict } from 'assert';

export interface Region {
    left: number;
    bottom: number;
    right: number;
    top: number;
    name: string;
    creationNumber: number;
    weatherId?: string;
    ambientId: string;
    color: RGBA;
}

export function read(buffer: WarBuffer): Region[] {
    const version = buffer.readUInt32LE();
    strict.equal(version, 5, 'Unknown regions version');
    return buffer.readArray(readRegion);
}

function readRegion(buffer: WarBuffer): Region {
    const region = {} as Region;
    region.left = buffer.readFloatLE();
    region.bottom = buffer.readFloatLE();
    region.right = buffer.readFloatLE();
    region.top = buffer.readFloatLE();
    region.name = buffer.readStringNT();
    region.creationNumber = buffer.readInt32LE();
    region.weatherId = buffer.readFourCC();
    region.ambientId = buffer.readStringNT();
    region.color = buffer.readRGBA();
    return region;
}
