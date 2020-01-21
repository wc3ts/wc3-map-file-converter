import { WarBuffer } from './warbuffer';
import { strict } from 'assert';

export interface Unit {
    type: string;
    variation: number;
    position: number[];
    rotation: number; // radians
    scale: number[];
    skin: string;
    // flag
    player: number;
    // unknown
    health: number;
    mana: number;
    // dropped items
    gold: number;
    targetAcquisition: number;
    level: number;
    str: number;
    agi: number;
    int: number;
    // items
    // abilities
    // rand
    color: number;
    id: number;
}

export function read(buffer: WarBuffer): Unit[] {
    const id = buffer.readBuffer(4).toString();
    strict.equal(id, 'W3do', 'Unknown units id');
    const version = buffer.readUInt32LE();
    strict.equal(version, 8, 'Unknown units version');
    const subversion = buffer.readInt32LE();
    strict.equal(subversion, 9, 'Unknown units subversion');
    return buffer.readArray(readUnit);
}

function readUnit(buffer: WarBuffer): Unit {
    const unit = {} as Unit;
    unit.type = buffer.readBuffer(4).toString();
    unit.variation = buffer.readInt32LE();
    unit.position = [buffer.readFloatLE(), buffer.readFloatLE(), buffer.readFloatLE()];
    unit.rotation = buffer.readFloatLE();
    unit.scale = [buffer.readFloatLE(), buffer.readFloatLE(), buffer.readFloatLE()];
    unit.skin = buffer.readBuffer(4).toString();
    buffer.readUInt8(); // visibility flag
    unit.player = buffer.readInt32LE();
    buffer.readBuffer(2); // unknown
    unit.health = buffer.readInt32LE();
    unit.mana = buffer.readInt32LE();

    // unit.droppedItemSetPtr = sb.readInt32LE();
    buffer.readInt32LE(); // dropped items

    unit.gold = buffer.readUInt32LE();
    unit.targetAcquisition = buffer.readFloatLE();
    unit.level = buffer.readInt32LE();
    unit.str = buffer.readInt32LE();
    unit.agi = buffer.readInt32LE();
    unit.int = buffer.readInt32LE();

    buffer.readInt32LE(); // items
    buffer.readInt32LE(); // abilities

    // TODO only set if type is b'uDNR', b'bDNR', b'iDNR'
    if (unit.type in ['uDNR', 'bDNR', 'iDNR']) {
        buffer.readInt32LE(); // random_type
    }

    unit.color = buffer.readInt32LE();
    unit.id = buffer.readUInt32LE();

    return unit
}
