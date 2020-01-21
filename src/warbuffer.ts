import { SmartBuffer } from 'smart-buffer';

export interface RGBA {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}

export class WarBuffer extends SmartBuffer {
    readFourCC(): string | undefined {
        const value = this.readBuffer(4).toString();
        if (value === '\u0000\u0000\u0000\u0000') {
            return undefined;
        }
        return value;
    }

    readRGBA(): RGBA {
        const rgba = {} as RGBA;
        rgba.blue = this.readUInt8();
        rgba.green = this.readUInt8();
        rgba.red = this.readUInt8();
        rgba.alpha = this.readUInt8();
        return rgba;
    }

    readArray<T>(readElement: (buffer: WarBuffer) => T): T[] {
        const length = this.readUInt32LE();
        return Array.from({ length }, () => readElement(this));
    }
}