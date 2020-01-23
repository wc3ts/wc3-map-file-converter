import { SmartBuffer } from 'smart-buffer';
import { strict } from 'assert';

export interface RGBA {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}

export class WarBuffer extends SmartBuffer {
    readBool(): boolean {
        const value = this.readUInt32LE();
        strict(value <= 1, `Boolean value: ${value} is greater than 1`);
        return value === 1;
    }

    readChar(): string {
        return this.readBuffer(1).toString();
    }

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

    readArray<T>(readElement: (buffer: WarBuffer) => T, length: number | undefined = undefined): T[] {
        if(length === undefined) {
            length = this.readUInt32LE();
        }
        return Array.from({ length }, () => readElement(this));
    }
}
