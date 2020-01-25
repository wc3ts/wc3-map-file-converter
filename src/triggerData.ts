import { WarBuffer } from './warbuffer';

// TODO handle " and ` the right way

export type TriggerData = Record<string, Record<string, Array<string>>>;

export function read(buff: Buffer): TriggerData {
    const buffer = new WarBuffer({buff});
    const text = buffer.readString(buffer.remaining());
    
    const lines = text
        .split(/[\r?\n]+/g)
        .map(line => line.trim())
        .filter(line => !line.startsWith('//')); // remove comments

    const data = {} as TriggerData;
    let currentSectionName: string | null = null;
    for(const line of lines) {
        if(line.startsWith('[')) {
            const sectionName = line.slice(1, -1);
            currentSectionName = sectionName;
            data[currentSectionName] = {};
        } else {
            const [name, values] = line.split(/=(.*)/);
            if(currentSectionName === null) {
                throw Error('Does not start with a section');
            }
            if(values) {
                data[currentSectionName][name] = values.split(',').map(value => value.trim());;
            } else {
                data[currentSectionName][name] = [];
            }
        }
    }
    return data;
}

export function getArgumentTypes(data: TriggerData, type: number, name: string): string[] {
    const sections = [
        'TriggerEvents',
        'TriggerConditions',
        'TriggerActions',
        'TriggerCalls'
    ];
    const argumentTypes = data[sections[type]][name]
        .filter(v => v !== '')
        .filter(v => v !== 'nothing')
        .filter((v: any) => isNaN(v));
    if(type === 3) {
        argumentTypes.shift(); // remove the return value
    }
    return argumentTypes;
}

export function substituteParameterValue(data: TriggerData, value: string): string {
    const values = data['TriggerParams'][value];
    if(values) {
        return values[2];
    }
    return value;
}
