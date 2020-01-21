import { WarBuffer } from './warbuffer';
import { strict } from 'assert';

export interface Camera {
    targetX: number;
    targetY: number;
    zOffset: number;
    rotation: number;
    angleOfAttack: number;
    distance: number;
    roll: number;
    fov: number;
    farZ: number;
    nearZ: number;
    localPitch: number;
    localYaw: number;
    localRoll: number;
    name: string;
}

export function read(buffer: WarBuffer): Camera[] {
    const version = buffer.readUInt32LE();
    strict.equal(version, 0, 'Unknown cameras version');
    return buffer.readArray(readCamera);
}

function readCamera(buffer: WarBuffer): Camera {
    const camera = {} as Camera;
    camera.targetX = buffer.readFloatLE();
    camera.targetY = buffer.readFloatLE();
    camera.zOffset = buffer.readFloatLE();
    camera.rotation = buffer.readFloatLE();
    camera.angleOfAttack = buffer.readFloatLE();
    camera.distance = buffer.readFloatLE();
    camera.roll = buffer.readFloatLE();
    camera.fov = buffer.readFloatLE();
    camera.farZ = buffer.readFloatLE();
    camera.nearZ = buffer.readFloatLE();
    camera.localPitch = buffer.readFloatLE();
    camera.localYaw = buffer.readFloatLE();
    camera.localRoll = buffer.readFloatLE();
    camera.name = buffer.readStringNT();
    return camera;
}
