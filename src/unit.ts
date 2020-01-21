import { WarBuffer } from './warbuffer';
import { strict } from 'assert';

export interface Unit {
    id?: string;
    variation: number;
    location: Location;
    /**
     *  Unit rotation in radians.
     */
    face: number;
    scale: Scale;
    skin?: string;
    flags: number;
    player: number;
    health: number;
    mana: number;
    itemDropTable: number;
    itemDropSets: ItemDropSet[];
    gold: number;
    targetAcquisition: number;
    level: number;
    str: number;
    agi: number;
    int: number;
    items: Item[];
    abilities: Ability[];
    color: number;
    randomType: number;
    random: number[];
    waygate: number;
    number: number;
}

export interface Location {
    x: number;
    y: number;
    z: number;
}

export interface Scale {
    x: number;
    y: number;
    z: number;
}

export type ItemDropSet = Array<ItemDrop>;

export interface ItemDrop {
    id?: string;
    chance: number;
}

export interface Item {
    id?: string;
    slot: number;
}

export interface Ability {
    id?: string;
    autocast: number;
    level: number;
}

export function read(buffer: WarBuffer): Unit[] {
    const id = buffer.readBuffer(4).toString();
    strict.equal(id, 'W3do', 'Unknown units id');
    const versionMajor = buffer.readUInt32LE();
    strict.equal(versionMajor, 8, 'Unknown units version');
    const versionMinor = buffer.readInt32LE();
    strict.equal(versionMinor, 11, 'Unknown units minor version');
    return buffer.readArray(readUnit);
}

function readUnit(buffer: WarBuffer): Unit {
    const unit = {} as Unit;
    unit.id = buffer.readFourCC();
    unit.variation = buffer.readUInt32LE();
    // TODO is the execution order for this guaranteed?
    unit.location = {
        x: buffer.readFloatLE(),
        y: buffer.readFloatLE(),
        z: buffer.readFloatLE(),
    };
    unit.face = buffer.readFloatLE();
    unit.scale = {
        x: buffer.readFloatLE(),
        y: buffer.readFloatLE(),
        z: buffer.readFloatLE(),
    };
    unit.skin = buffer.readFourCC();
    unit.flags = buffer.readUInt8();
    unit.player = buffer.readUInt32LE();

    // unknown
    strict.equal(buffer.readUInt8(), 0);
    strict.equal(buffer.readUInt8(), 0);

    unit.health = buffer.readInt32LE();
    unit.mana = buffer.readInt32LE();

    unit.itemDropTable = buffer.readInt32LE();
    unit.itemDropSets = buffer.readArray(() => {
        return buffer.readArray(() => {
            const item = {} as ItemDrop;
            item.id = buffer.readFourCC();
            item.chance = buffer.readUInt32LE();
            return item;
        });
    });

    unit.gold = buffer.readUInt32LE();
    unit.targetAcquisition = buffer.readFloatLE();
    unit.level = buffer.readUInt32LE();
    unit.str = buffer.readUInt32LE();
    unit.agi = buffer.readUInt32LE();
    unit.int = buffer.readUInt32LE();

    unit.items = buffer.readArray(() => {
        const item = {} as Item;
        item.slot = buffer.readUInt32LE();
        item.id = buffer.readFourCC();
        return item;
    });

    unit.abilities = buffer.readArray(() => {
        const abilitiy = {} as Ability;
        abilitiy.id = buffer.readFourCC();
        abilitiy.autocast = buffer.readUInt32LE();
        abilitiy.level = buffer.readUInt32LE();
        return abilitiy;
    });

    unit.randomType = buffer.readInt32LE();

    function randomLength(): number | never {
        switch (unit.randomType) {
            case 0:
                return 4;
            case 1:
                return 8;
            case 2:
                return buffer.readUInt32LE() * 8;
            default:
                throw Error(`Unkown random type ${unit.randomType}`);
        }
    }

    unit.random = Array.from({ length: randomLength() }, () => buffer.readUInt8());
    unit.color = buffer.readInt32LE();
    unit.waygate = buffer.readInt32LE();
    unit.number = buffer.readUInt32LE();
    return unit
}
