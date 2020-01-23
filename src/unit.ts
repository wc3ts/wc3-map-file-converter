import { strict } from 'assert';
import { WarBuffer } from './warbuffer';

export interface Unit {
    id?: string;
    variation: number;
    location: {
        x: number;
        y: number;
        z: number;
    };
    /** Unit rotation in radians. */
    face: number;
    scale: {
        x: number;
        y: number;
        z: number;
    };
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

export type ItemDropSet = Array<ItemDrop>;

export interface ItemDrop {
    id?: string;
    chance: number;
}

function readItemDrop(buffer: WarBuffer): ItemDrop {
    const item = {} as ItemDrop;
    item.id = buffer.readFourCC();
    item.chance = buffer.readUInt32LE();
    return item;
}

export interface Item {
    id?: string;
    slot: number;
}

function readItem(buffer: WarBuffer): Item {
    const item = {} as Item;
    item.slot = buffer.readUInt32LE();
    item.id = buffer.readFourCC();
    return item;
}

export interface Ability {
    id?: string;
    autocast: number;
    level: number;
}

function readAbility(buffer: WarBuffer): Ability {
    const abilitiy = {} as Ability;
    abilitiy.id = buffer.readFourCC();
    abilitiy.autocast = buffer.readUInt32LE();
    abilitiy.level = buffer.readUInt32LE();
    return abilitiy;
}

export function read(buff: Buffer): Unit[] {
    const buffer = new WarBuffer({ buff });
    const id = buffer.readFourCC();
    strict.equal(id, 'W3do');
    const versionMajor = buffer.readUInt32LE();
    strict.equal(versionMajor, 8);
    const versionMinor = buffer.readUInt32LE();
    strict.equal(versionMinor, 11);
    const units = buffer.readArray(readUnit);
    strict.equal(buffer.remaining(), 0);
    return units;
}

function readUnit(buffer: WarBuffer): Unit {
    const unit = {} as Unit;
    unit.id = buffer.readFourCC();
    unit.variation = buffer.readUInt32LE();
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

    strict.equal(buffer.readUInt16LE(), 0); // TODO unknown

    unit.health = buffer.readInt32LE();
    unit.mana = buffer.readInt32LE();
    unit.itemDropTable = buffer.readInt32LE();
    unit.itemDropSets = buffer.readArray(b => b.readArray(readItemDrop));
    unit.gold = buffer.readUInt32LE();
    unit.targetAcquisition = buffer.readFloatLE();
    unit.level = buffer.readUInt32LE();
    unit.str = buffer.readUInt32LE();
    unit.agi = buffer.readUInt32LE();
    unit.int = buffer.readUInt32LE();
    unit.items = buffer.readArray(readItem);
    unit.abilities = buffer.readArray(readAbility);

    unit.randomType = buffer.readInt32LE();

    function randomLength(): number | never {
        switch (unit.randomType) {
            case 0: return 4;
            case 1: return 8;
            case 2: return buffer.readUInt32LE() * 8;
            default: throw Error(`Unknown random type ${unit.randomType}`);
        }
    }

    unit.random = buffer.readArray(b => b.readUInt8(), randomLength());

    unit.color = buffer.readInt32LE();
    unit.waygate = buffer.readInt32LE();
    unit.number = buffer.readUInt32LE();
    return unit
}
