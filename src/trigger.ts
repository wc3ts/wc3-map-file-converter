import { RGBA, WarBuffer } from './warbuffer';
import { strict } from 'assert';

import * as ini from 'ini';

import { readFileSync } from 'fs';
import { trigger } from '.';

export interface File {
    categoryCount: number,
    triggerCount: number,
    commentCount: number,
    customScriptCount: number;
    variableCount: number,
    variables: Variable[],
    elementCount: number,
    mapName: string,
    categories: Category[],
    triggers: Trigger[]
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

export enum ElementType {
	Category = 4,
	Trigger = 8,
	Comment = 16,
	Script = 32,
	Variable = 64
}

export interface Category {
    id: number,
    name: string,
    parentId: number
    isComment: boolean,
}

export interface Trigger {
    id: number,
    name: string,
    parentId: number
    kind: ElementType,
    description: string,
    isComment: boolean,
    isEnabled: boolean,
    isScript: boolean,
    isInitiallyDisabled: boolean,
    shouldRunOnInitialization: boolean,
    events: Event[],
    conditions: Condition[],
    actions: Action[],
    ecas: ECA[]
}

export enum ECAType {
    Event,
    Condtion,
    Action,
}

export interface ECA {
    kind: ECAType
    name: string,
    isEnabled: boolean,
    parameters: Parameter[],
    children: ECA[],
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
    kind: ParameterType;
    value: string;
    hasSubParameter: boolean;
    subParameter?: SubParameter;
    isArray: boolean;
    default?: Parameter;
}

export enum SubParameterType {
    Events,
    Conditions,
    Actions,
    Calls,
}

export interface SubParameter {
    kind: SubParameterType;
    name: string;
    hasParameters: boolean;
    parameters: Parameter[];
}

export interface Event extends ECA {
    kind: ECAType.Event
}

export interface Condition extends ECA {
    kind: ECAType.Condtion
}

export interface Action extends ECA {
    kind: ECAType.Action
}

export function read(buff: Buffer): File
{
    // TODO move away
    const triggerData = ini.parse(readFileSync('TriggerData.txt', 'utf-8'));
    const sections = ['TriggerEvents', 'TriggerConditions', 'TriggerActions', 'TriggerCalls'];

    const argumentCounts: Record<string, number> = {};
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
                    argumentCounts[name] = args;
                }
            }
        }
    }

    const buffer = new WarBuffer({ buff });
    const id = buffer.readFourCC();
    strict.equal(id, 'WTG!', 'Unknown trigger magic');

    const unknownVersionPart = buffer.readUInt32LE();
    strict.equal(unknownVersionPart, 0x80000004);

    const version = buffer.readUInt32LE();
    strict.equal(version, 7, 'Map version not Frozen Throne');

    // unknown
    strict.equal(buffer.readUInt32LE(), 1);
    strict.equal(buffer.readUInt32LE(), 0);
    strict.equal(buffer.readUInt32LE(), 0);
    strict.equal(buffer.readUInt32LE(), 0);

    const triggerFile = {} as File;

    triggerFile.categoryCount = buffer.readUInt32LE();
    const deletedCategoryCount = buffer.readUInt32LE();
    buffer.readBuffer(4 *  deletedCategoryCount);
    
    triggerFile.triggerCount = buffer.readUInt32LE();
    const deletedTriggerCount = buffer.readUInt32LE();
    buffer.readBuffer(4 *  deletedTriggerCount);

    triggerFile.commentCount = buffer.readUInt32LE();
    const deletedCommentCount = buffer.readUInt32LE();
    buffer.readBuffer(4 *  deletedCommentCount);

    triggerFile.customScriptCount = buffer.readUInt32LE();
    const deletedCustomScriptCount = buffer.readUInt32LE();
    buffer.readBuffer(4 *  deletedCustomScriptCount);

    triggerFile.variableCount = buffer.readUInt32LE();
    const deletedVariableCount = buffer.readUInt32LE();
    buffer.readBuffer(4 *  deletedVariableCount);

    buffer.readUInt32LE();
    buffer.readUInt32LE();
    buffer.readUInt32LE();

    triggerFile.variableCount = buffer.readUInt32LE();

    triggerFile.variables = [];
    for (let i = 0; i < triggerFile.variableCount; i++) {
        const variable = {} as Variable;

        variable.name = buffer.readStringNT();
        variable.type = buffer.readStringNT();

        strict.equal(buffer.readUInt32LE(), 1);

        variable.isArray = buffer.readBool();
        variable.arraySize = buffer.readUInt32LE();

        variable.isInitialized = buffer.readBool();

        variable.initialValue = buffer.readStringNT();

        variable.id = buffer.readUInt32LE();
        variable.parentId = buffer.readUInt32LE();

        triggerFile.variables.push(variable);
    }

    triggerFile.elementCount = buffer.readUInt32LE();

    strict.equal(buffer.readUInt32LE(), 1);
    strict.equal(buffer.readUInt32LE(), 0);

    triggerFile.mapName = buffer.readStringNT();

    strict.equal(buffer.readUInt32LE(), 0);
    strict.equal(buffer.readUInt32LE(), 0);
    strict.equal(buffer.readInt32LE(), -1);

    triggerFile.categories = [];
    triggerFile.triggers = [];

    for (let i = 0; i < (triggerFile.elementCount - 1); i++) {
        const elementType = buffer.readUInt32LE() as ElementType;
        switch (elementType) {
            case ElementType.Category:
                const category = readCategory(buffer);
                triggerFile.categories.push(category);
                break;
            case ElementType.Trigger:
            case ElementType.Comment:
            case ElementType.Script:
                const trigger = readTrigger(buffer, argumentCounts);
                trigger.kind = elementType;
                triggerFile.triggers.push(trigger);

                break;
            case ElementType.Variable:
                // variables are already parsed adn saved above we dont need to change anyhting here
                buffer.readUInt32LE() // id
                buffer.readStringNT() // name
                buffer.readUInt32LE() // parent id
                break;
            default:
                throw Error('AUUUA');
        }
    }
    console.log(triggerFile);

    console.log('read', buffer.readOffset, 'remaining', buffer.remaining());

    //strict.equal(buffer.remaining(), 0);

    return triggerFile;
}

function readCategory(buffer: WarBuffer): Category {
    const category = {} as Category;

    category.id = buffer.readUInt32LE();
    category.name = buffer.readStringNT();
    category.isComment = buffer.readBool(); // TODO maybe not a bool?
    buffer.readUInt32LE(); // TODO unknown
    category.parentId = buffer.readUInt32LE();

    return category;
}

function readTrigger(buffer: WarBuffer, argumentCounts: Record<string, number>): Trigger {
    const trigger = {} as Trigger;

    trigger.name = buffer.readStringNT();
    trigger.description = buffer.readStringNT();
    trigger.isComment = buffer.readBool();
    trigger.id = buffer.readUInt32LE();
    trigger.isEnabled = buffer.readBool();
    trigger.isScript = buffer.readBool(); // TODO throw on is script
    trigger.isInitiallyDisabled = buffer.readBool();
    trigger.shouldRunOnInitialization = buffer.readBool();


    trigger.parentId = buffer.readUInt32LE();
    //console.log(buffer.readInt32LE()) // TODO unknown


    trigger.ecas = Array.from({length: buffer.readUInt32LE()}, () => readECA(buffer, argumentCounts, false));


    return trigger;
}

function readECA(buffer: WarBuffer, argumentCounts: Record<string, number>, child: boolean): ECA {
    const eca = {} as ECA;
    eca.kind = buffer.readUInt32LE();
    if(child) {
        eca.parent = buffer.readUInt32LE();
    }
    eca.name = buffer.readStringNT();
    eca.isEnabled = buffer.readBool();
    eca.parameters = Array.from({length: argumentCounts[eca.name]}, () => readParameter(buffer, argumentCounts));
    eca.children = Array.from({length: buffer.readUInt32LE()}, () => readECA(buffer, argumentCounts, true));
    return eca;
}

function readParameter(buffer: WarBuffer, argumentCounts: Record<string, number>): Parameter {
    const parameter = {} as Parameter;
    parameter.kind = buffer.readUInt32LE();
    parameter.value = buffer.readStringNT();
    parameter.hasSubParameter = buffer.readBool();
    if(parameter.hasSubParameter) {
        const subParameter = {} as SubParameter;
        subParameter.kind = buffer.readUInt32LE();
        subParameter.name = buffer.readStringNT();
        subParameter.hasParameters = buffer.readBool();
        if (subParameter.hasParameters) {
            subParameter.parameters = Array.from({length: argumentCounts[subParameter.name]}, () => readParameter(buffer, argumentCounts));
        }
        buffer.readUInt32LE(); // unknown
        parameter.subParameter = subParameter;
    }
    parameter.isArray = buffer.readBool();
    if (parameter.isArray) {
		parameter.default = readParameter(buffer, argumentCounts);
    }    
    return parameter;
}
