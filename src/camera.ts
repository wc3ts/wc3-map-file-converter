import { WarBuffer } from './warbuffer';
import { strict } from 'assert';

export interface Camera {
    target: {
        x: number;
        y: number;
    };
    zoffset: number;
    rotation: number;
    /** Angle of attack */
    aoa: number;
    distance: number;
    roll: number;
    /** Field of view */
    fov: number;
    /** far clipping */
    farz: number;
    /** near clipping */
    nearz: number;
    localPitch: number;
    localYaw: number;
    localRoll: number;
    name: string;
}

export function read(buff: Buffer): Camera[] {
    const buffer = new WarBuffer({ buff });
    const version = buffer.readUInt32LE();
    strict.equal(version, 0, 'Unknown cameras version');
    const result = buffer.readArray(readCamera);
    strict.equal(buffer.remaining(), 0);
    return result;
}

function readCamera(buffer: WarBuffer): Camera {
    const camera = {} as Camera;
    camera.target = {
        x: buffer.readFloatLE(),
        y: buffer.readFloatLE()
    };
    camera.zoffset = buffer.readFloatLE();
    camera.rotation = buffer.readFloatLE();
    camera.aoa = buffer.readFloatLE();
    camera.distance = buffer.readFloatLE();
    camera.roll = buffer.readFloatLE();
    camera.fov = buffer.readFloatLE();
    camera.farz = buffer.readFloatLE();
    camera.nearz = buffer.readFloatLE();
    camera.localPitch = buffer.readFloatLE();
    camera.localYaw = buffer.readFloatLE();
    camera.localRoll = buffer.readFloatLE();
    camera.name = buffer.readStringNT();
    return camera;
}
