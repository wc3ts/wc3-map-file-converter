import { RGBA, WarBuffer } from './warbuffer';
import { strict } from 'assert';

export interface Trigger {
}

export function read(buff: Buffer): Trigger[]
{
    const buffer = new WarBuffer({ buff });
    const id = buffer.readBuffer(4).toString();
    // the exclamation mark probably isnt part of the magic
    // it rather bleongs to the version ?
    strict.equal(id, 'WTG!', 'Unknown trigger magic');


    // Version is super weird for this one
    const versionMajor = buffer.readUInt32LE();
    console.log(versionMajor)
    strict.equal(versionMajor, 4, 'Unknown triger major version');

    const versionMinor = buffer.readUInt32LE();
    console.log(versionMinor)
    strict.equal(versionMinor, 11, 'Unknown triger minor version');

    const result = buffer.readArray(readTrigger);
    strict.equal(buffer.remaining(), 0);

    return result;
}

function readTrigger(buffer: WarBuffer): Trigger {
    // TODO stub

    const trigger = {} as Trigger;

    return trigger;
}
