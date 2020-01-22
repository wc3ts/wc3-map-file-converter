import { WarBuffer } from './warbuffer';
import { strict } from 'assert';

export interface Sound {
    name: string;
    path: string;
    effect: string;
    flags: number;
    fade: {
        in: number;
        out: number;
    };
    volume: number;
    pitch: number;
    channel: number;
    distance: {
        min: number;
        max: number;
        cutoff: number;
    };
    cone: {
        inside: number;
        outside: number;
        volume: number;
        orientation: {
            x: number;
            y: number;
            z: number;
        };
    };
    script: {
        name: string;
        label: string;
        path: string;
    };
}

export function read(buff: Buffer): Sound[] {
    const buffer = new WarBuffer({ buff });
    const version = buffer.readUInt32LE();
    strict.equal(version, 2, 'Unknown sounds version');
    const sounds = buffer.readArray(readSound);
    strict.equal(buffer.remaining(), 0);
    return sounds;
}

function readSound(buffer: WarBuffer): Sound {
    const sound = {} as Sound;
    sound.name = buffer.readStringNT();
    sound.path = buffer.readStringNT();
    sound.effect = buffer.readStringNT();
    sound.flags = buffer.readUInt32LE();
    sound.fade = {
        in: buffer.readUInt32LE(),
        out: buffer.readUInt32LE()
    };
    sound.volume = buffer.readUInt32LE();
    sound.pitch = buffer.readFloatLE();

    buffer.readBuffer(8); // TODO unknown

    sound.channel = buffer.readUInt32LE();
    sound.distance = {
        min: buffer.readFloatLE(),
        max: buffer.readFloatLE(),
        cutoff: buffer.readFloatLE()
    };
    sound.cone = {
        inside: buffer.readFloatLE(),
        outside: buffer.readFloatLE(),
        volume: buffer.readInt32LE(),
        orientation: {
            x: buffer.readFloatLE(),
            y: buffer.readFloatLE(),
            z: buffer.readFloatLE()
        }
    };
    sound.script = {
        name: buffer.readStringNT(),
        label: buffer.readStringNT(),
        path: buffer.readStringNT(),
    };

    buffer.readBuffer(18); // TODO unknown

    return sound;
}
