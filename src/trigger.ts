import { WarBuffer } from './warbuffer';
import { strict } from 'assert';
import { parse } from 'ini';
import { readFileSync } from 'fs';

export interface Data {
    mapName: string;
    variables: Variable[];
    items: Item[];
}

export interface Variable {
    name: string,
    type: string,
    isArray: boolean,
    arraySize: number,
    isInitialized: boolean,
    initialValue: string,
    id: number,
    parentId: number
}

export enum ItemType {
	Category = 4,
	Trigger = 8,
	Comment = 16,
	Script = 32,
	Variable = 64
}

/** Either a categrory trigger, comment, script or variable  */
export interface Item {
    type: ItemType;
    id: number;
    name: string;
    parentId: number;
}

export interface Category extends Item  {
    type: ItemType.Category;
    isComment: boolean;
}

export interface Trigger extends Item {
    type: ItemType.Script | ItemType.Comment | ItemType.Trigger;
    isComment: boolean;
    description: string;
    isEnabled: boolean;
    isScript: boolean;
    isInitiallyDisabled: boolean;
    nodes: Node[];
}

export enum NodeType {
	Event = 0,
	Condtion = 1,
	Action = 2
}

/** A event, condition or action. */
export interface Node {
    type: NodeType
    name: string,
    isEnabled: boolean,
    parameters: Parameter[],
    nodes: Node[],
    parent?: number
}

export enum ParameterType {
    Invalid = -1,
    Preset,
    Variable,
    Function,
    String
}

export interface Parameter {
    type: ParameterType;
    dataType: string;
    value: string;
    /** Set if this parameter is the return value of the given function. */
    func?: Func;
    /** Set if this parameter is an array. */
    index?: Parameter;
}

export enum FuncType {
	Event = 0,
	Condition = 1,
    Action = 2,
    Call = 3,
}

export interface Func {
    type: FuncType;
    name: string;
    parameters: Parameter[];
}

const triggerData = parse(readFileSync('TriggerData.txt', 'utf-8'));

function getParameterDataTypes(func: Func): string[] {
    const sections = {
        [FuncType.Event]: 'TriggerEvents',
        [FuncType.Condition]: 'TriggerConditions',
        [FuncType.Action]: 'TriggerActions',
        [FuncType.Call]: 'TriggerCalls'
    };
    const paramsTypes = triggerData[sections[func.type]][func.name].split(',')
        .map((v: any) => v.trim())
        .filter((v: any) => v !== '')
        .filter((v: any) => v !== 'nothing')
        .filter(isNaN);
    if(func.type == FuncType.Call) {
        paramsTypes.shift(); // remove the return value
    }
    return paramsTypes;
}

function getParameterCount(name: string) {
    const sections = ['TriggerEvents', 'TriggerConditions', 'TriggerActions', 'TriggerCalls'];
    const parameterCount: Record<string, number> = {};
    for (const section of sections) {
        for (const name in triggerData[section]) {
            if (triggerData[section].hasOwnProperty(name)) {
                const parameters = triggerData[section][name];
                if (!(name.startsWith('_') || name.startsWith('//'))) {
                    let args = 0;
                    args += parameters.split(','
                    )
                    .map((v: any) => v.trim())
                    .filter((v: any) => v !== '')
                    .filter((v: any) => v !== 'nothing')
                    .filter(isNaN)
                    .length;
                    if(section === 'TriggerCalls') {
                        args--;
                    }
                    parameterCount[name] = args;
                }
            }
        }
    }
    return parameterCount[name];
}

export function read(buff: Buffer): Data
{
    const buffer = new WarBuffer({ buff });
    const id = buffer.readFourCC();
    strict.equal(id, 'WTG!');

    const unknownVersionPart = buffer.readUInt32LE();
    strict.equal(unknownVersionPart, 0x80000004);

    const version = buffer.readUInt32LE();
    strict.equal(version, 7, 'Map version not Frozen Throne');

    strict.equal(buffer.readUInt32LE(), 1);
    strict.equal(buffer.readUInt32LE(), 0);
    strict.equal(buffer.readUInt32LE(), 0);
    strict.equal(buffer.readUInt32LE(), 0);

    const data = {} as Data;

    buffer.readUInt32LE(); // category count
    buffer.readBuffer(4 *  buffer.readUInt32LE());
    
    buffer.readUInt32LE(); // trigger count
    buffer.readBuffer(4 *  buffer.readUInt32LE());

    buffer.readUInt32LE(); // comment count
    buffer.readBuffer(4 *  buffer.readUInt32LE());

    buffer.readUInt32LE(); // custom script count
    buffer.readBuffer(4 *  buffer.readUInt32LE());

    buffer.readUInt32LE(); // variable count
    buffer.readBuffer(4 *  buffer.readUInt32LE());

    buffer.readUInt32LE();
    buffer.readUInt32LE();
    buffer.readUInt32LE();

    data.variables = buffer.readArray(readVariable);

    const elementCount = buffer.readUInt32LE();

    strict.equal(buffer.readUInt32LE(), 1);
    strict.equal(buffer.readUInt32LE(), 0);

    data.mapName = buffer.readStringNT();

    strict.equal(buffer.readUInt32LE(), 0);
    strict.equal(buffer.readUInt32LE(), 0);
    strict.equal(buffer.readInt32LE(), -1);

    data.items = Array
        .from({length: elementCount - 1}, () => readItem(buffer))
        .filter(item => item.type !== ItemType.Variable);

    strict.equal(buffer.remaining(), 0);

    return data;
}

function readItem(buffer: WarBuffer): Item | never {
    const type = buffer.readUInt32LE() as ItemType;
        switch (type) {
            case ItemType.Category:
                return readCategory(buffer);
            case ItemType.Trigger:
            case ItemType.Comment:
            case ItemType.Script:
                return readTrigger(buffer, type);
            case ItemType.Variable:
                return {
                    type: type,
                    id: buffer.readUInt32LE(),
                    name: buffer.readStringNT(),
                    parentId: buffer.readUInt32LE()
                };
            default:
                throw Error(`Unknown element type ${type}`);
        }
}

function readVariable(buffer: WarBuffer): Variable {
    const variable = {} as Variable;
    variable.name = buffer.readStringNT();
    variable.type = buffer.readStringNT();

    strict.equal(buffer.readUInt32LE(), 1); // TODO boolean?

    variable.isArray = buffer.readBool();
    variable.arraySize = buffer.readUInt32LE();
    variable.isInitialized = buffer.readBool();
    variable.initialValue = buffer.readStringNT();
    variable.id = buffer.readUInt32LE();
    variable.parentId = buffer.readUInt32LE();
    return variable;
}

function readCategory(buffer: WarBuffer): Category {
    const category = {} as Category;
    category.type = ItemType.Category;
    category.id = buffer.readUInt32LE();
    category.name = buffer.readStringNT();
    category.isComment = buffer.readBool();

    buffer.readUInt32LE(); // TODO boolean ?

    category.parentId = buffer.readUInt32LE();
    return category;
}

function readTrigger(buffer: WarBuffer, type: ItemType.Script | ItemType.Comment | ItemType.Trigger): Trigger {
    const trigger = {} as Trigger;
    trigger.type = type;
    trigger.name = buffer.readStringNT();
    trigger.description = buffer.readStringNT();
    trigger.isComment = buffer.readBool();
    trigger.id = buffer.readUInt32LE();
    trigger.isEnabled = buffer.readBool();
    trigger.isScript = buffer.readBool();
    trigger.isInitiallyDisabled = buffer.readBool();

    strict.equal(buffer.readBool(), false); // should run on initialization

    trigger.parentId = buffer.readUInt32LE();
    trigger.nodes = buffer.readArray(b => readNode(buffer, false));
    return trigger;
}

function readNode(buffer: WarBuffer, child: boolean): Node {
    const node = {} as Node;
    node.type = buffer.readUInt32LE();
    if(child) {
        node.parent = buffer.readUInt32LE();
    }
    node.name = buffer.readStringNT();
    node.isEnabled = buffer.readBool();
    node.parameters = buffer.readArray(b => readParameter(b), getParameterCount(node.name));
    node.nodes = buffer.readArray(b => readNode(b, true));
    return node;
}

function readParameter(buffer: WarBuffer): Parameter {
    const parameter = {} as Parameter;
    parameter.type = buffer.readUInt32LE();
    parameter.value = buffer.readStringNT();
    if(buffer.readBool()) { // is return value of function
        parameter.func = readFunction(buffer);
    }
    if (buffer.readBool()) { // is array
		parameter.index = readParameter(buffer);
    }
    return parameter;
}

function readFunction(buffer: WarBuffer) : Func
{
    const func = {} as Func;
    func.type = buffer.readUInt32LE();
    func.name = buffer.readStringNT();
    if (buffer.readBool()) { // has parameters
        func.parameters = Array.from({length: getParameterCount(func.name)}, () => readParameter(buffer));
        getParameterDataTypes(func).forEach((dataType, i) => {
            func.parameters[i].dataType = dataType;
        });
    }

    strict.equal(buffer.readUInt32LE(), 0); // unknown
    
    return func;
}
