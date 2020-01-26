import { WarBuffer } from './warbuffer';
import { strict } from 'assert';
import { getArgumentTypes, substituteParameterValue, TriggerData } from './triggerData';

export interface Data {
    mapName: string;
    variables: Variable[];
    items: Item[];
}

export interface Variable {
    name: string,
    kind: string,
    isArray: boolean,
    arraySize: number,
    isInitialized: boolean,
    initialValue: string,
    id: number,
    parentId: number
}

export enum ItemKind {
	Category = 4,
	Trigger = 8,
	Comment = 16,
	Script = 32,
	Variable = 64
}

/** Either a categrory trigger, comment, script or variable  */
export interface Item {
    kind: ItemKind;
    id: number;
    name: string;
    parentId: number;
}

export interface Category extends Item  {
    kind: ItemKind.Category;
    isComment: boolean;
}

export interface Trigger extends Item {
    kind: ItemKind.Script | ItemKind.Comment | ItemKind.Trigger;
    isComment: boolean;
    description: string;
    isEnabled: boolean;
    isScript: boolean;
    isInitiallyDisabled: boolean;
    nodes: Node[];
}

// Type guard
export function isItemTrigger(item: Item): item is Trigger {
    return item.kind === ItemKind.Script || item.kind === ItemKind.Comment || item.kind === ItemKind.Trigger;
}

export enum NodeKind {
	Event = 0,
	Condition = 1,
    Action = 2,
    Call = 3,
}

/** A event, condition or action. */
export interface Node {
    kind: NodeKind
    name: string,
    isEnabled: boolean,
    parameters: Parameter[],
    nodes: Node[],
    parent?: number
}

export enum ParameterKind {
    Invalid = -1,
    Preset,
    Variable,
    Function,
    String
}

export interface Parameter {
    kind: ParameterKind;
    type: string;
    value: string;
    /** Set if this parameter is the return value of the given function. */
    func?: Func;
    /** Set if this parameter is an array. */
    index?: Parameter;
}

export interface Func {
    kind: NodeKind;
    name: string;
    parameters: Parameter[];
}

export function read(buff: Buffer, triggerData: TriggerData): Data
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
        .from({length: elementCount - 1}, () => readItem(buffer, triggerData))
        .filter(item => item.kind !== ItemKind.Variable);

    strict.equal(buffer.remaining(), 0);

    return data;
}

function readItem(buffer: WarBuffer, triggerData: TriggerData): Item | never {
    const kind = buffer.readUInt32LE() as ItemKind;
        switch (kind) {
            case ItemKind.Category:
                return readCategory(buffer);
            case ItemKind.Trigger:
            case ItemKind.Comment:
            case ItemKind.Script:
                return readTrigger(buffer, triggerData, kind);
            case ItemKind.Variable:
                return {
                    kind: kind,
                    id: buffer.readUInt32LE(),
                    name: buffer.readStringNT(),
                    parentId: buffer.readUInt32LE()
                };
            default:
                throw Error(`Unknown element kind ${kind}`);
        }
}

function readVariable(buffer: WarBuffer): Variable {
    const variable = {} as Variable;
    variable.name = buffer.readStringNT();
    variable.kind = buffer.readStringNT();

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
    category.kind = ItemKind.Category;
    category.id = buffer.readUInt32LE();
    category.name = buffer.readStringNT();
    category.isComment = buffer.readBool();

    buffer.readUInt32LE(); // TODO boolean ?

    category.parentId = buffer.readUInt32LE();
    return category;
}

function readTrigger(buffer: WarBuffer, triggerData: TriggerData, kind: ItemKind.Script | ItemKind.Comment | ItemKind.Trigger): Trigger {
    const trigger = {} as Trigger;
    trigger.kind = kind;
    trigger.name = buffer.readStringNT();
    trigger.description = buffer.readStringNT();
    trigger.isComment = buffer.readBool();
    trigger.id = buffer.readUInt32LE();
    trigger.isEnabled = buffer.readBool();
    trigger.isScript = buffer.readBool();
    trigger.isInitiallyDisabled = buffer.readBool();

    strict.equal(buffer.readBool(), false); // should run on initialization

    trigger.parentId = buffer.readUInt32LE();
    trigger.nodes = buffer.readArray(b => readNode(buffer, triggerData, false));
    return trigger;
}

function readNode(buffer: WarBuffer, triggerData: TriggerData, child: boolean): Node {
    const node = {} as Node;
    node.kind = buffer.readUInt32LE();
    if(child) {
        node.parent = buffer.readUInt32LE();
    }
    node.name = buffer.readStringNT();
    node.isEnabled = buffer.readBool();
    node.parameters = buffer.readArray(b => readParameter(b, triggerData), getArgumentTypes(triggerData, node.kind, node.name).length);
    node.parameters.forEach((parameter, i) => {
        parameter.type = getArgumentTypes(triggerData, node.kind, node.name)[i];
    });
    node.nodes = buffer.readArray(b => readNode(b, triggerData, true));
    return node;
}

function readParameter(buffer: WarBuffer, triggerData: TriggerData): Parameter {
    const parameter = {} as Parameter;
    parameter.kind = buffer.readUInt32LE();
    parameter.value = substituteParameterValue(triggerData, buffer.readStringNT());
    if(buffer.readBool()) { // is return value of function
        parameter.func = readFunction(buffer, triggerData);
    }
    if (buffer.readBool()) { // is array
		parameter.index = readParameter(buffer, triggerData);
    }
    return parameter;
}

function readFunction(buffer: WarBuffer, triggerData: TriggerData) : Func
{
    const func = {} as Func;
    func.kind = buffer.readUInt32LE();
    func.name = buffer.readStringNT();
    if (buffer.readBool()) { // has parameters
        func.parameters = Array.from({length: getArgumentTypes(triggerData, func.kind, func.name).length}, () => readParameter(buffer, triggerData));
        func.parameters.forEach((parameter, i) => {
            parameter.type = getArgumentTypes(triggerData, func.kind, func.name)[i];
        });
    }

    strict.equal(buffer.readUInt32LE(), 0); // unknown
    
    return func;
}
