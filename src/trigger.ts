import { RGBA, WarBuffer } from './warbuffer';
import { strict } from 'assert';

import * as ini from 'ini';

import { readFileSync } from 'fs';

export interface TriggerFile {
    categoryCount: number,
    triggerCount: number,
    commentCount: number,
    customScriptCount: number;
    variableCount: number,
    variables: TriggerFileVariable[],
    elementCount: number,
    mapName: string,
    categories: TriggerCategory[],
    triggers: TriggerFileTrigger[]
}

export interface TriggerFileVariable {
    name: string,
    type: string,
    isArray: boolean,
    arraySize: number,
    isInitialized: boolean,
    initialValue: string,
    id: number,
    parentId: number
}

export enum TriggerFileElementType {
    Category = 4,
    GUI = 8,
    Comment = 16,
    Trigger = 32,
    Variable = 64,
}

export interface TriggerFileElement {
    kind: TriggerFileElementType,
    id: number,
    name: string,
    parentId: number
}

export interface TriggerCategory extends TriggerFileElement {
    kind: TriggerFileElementType.Category,
    isComment: boolean,
}

export interface TriggerFileTrigger extends TriggerFileElement {
    kind: TriggerFileElementType.Trigger,
    description: string,
    isComment: boolean,
    isEnabled: boolean,
    isScript: boolean,
    isInitiallyEnabled: boolean,
    shouldRunOnInitialization: boolean,
    events: TriggerFileTriggerEvent[],
    conditions: TriggerFileTriggerCondition[],
    actions: TriggerFileTriggerAction[],
}

export enum TriggerFileECAType {
    Event,
    Condtion,
    Action,
}

export interface TriggerFileTriggerECA {
    kind: TriggerFileECAType
    name: string,
    isEnabled: boolean,
    parameters: TriggerFileTriggerECAParameter[],
    children: TriggerFileTriggerECA[],
    parent?: number
}

export enum TriggerFileTriggerECAParameterType {
    Invalid = -1,
    Preset,
    Variable,
    Function,
    String
}

export interface TriggerFileTriggerECAParameter {
    kind: TriggerFileTriggerECAParameterType,
    value: string,
    hasSubParameter: boolean,
}

export enum TriggerFileTriggerECASubParameterType {
    Events,
    Conditions,
    Actions,
    Calls,
}

export interface TriggerFileTriggerECASubParameter {
    kind: TriggerFileTriggerECASubParameterType,
    name: string,
    hasParameters: boolean,
    parameters: TriggerFileTriggerECAParameter
}

export interface TriggerFileTriggerEvent extends TriggerFileTriggerECA {
    kind: TriggerFileECAType.Event
}

export interface TriggerFileTriggerCondition extends TriggerFileTriggerECA {
    kind: TriggerFileECAType.Condtion
}


export interface TriggerFileTriggerAction extends TriggerFileTriggerECA {
    kind: TriggerFileECAType.Action
}


export function read(buff: Buffer): TriggerFile
{
    // TODO move away
    const triggerData = ini.parse(readFileSync('TriggerData.txt', 'utf-8'));
    const sections = ['TriggerEvents', 'TriggerConditions', 'TriggerActions', 'TriggerCalls'];

    const database: Record<string, number> = {};
    for (const section of sections) {
    
        for (const name in triggerData[section]) {

            if (triggerData[section].hasOwnProperty(name)) {
                const parameters = triggerData[section][name];

                if (!(name.startsWith('_') || name.startsWith('//'))) {
                    database[name] = parameters.split(',').filter((v: any) => v !== 'nothing' && isNaN(v)).length;
                }
            }
        }
    }
    console.log(database);


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

    const triggerFile = {} as TriggerFile;

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
        const variable = {} as TriggerFileVariable;

        variable.name = buffer.readStringNT();
        variable.type = buffer.readStringNT();

        strict.equal(buffer.readUInt32LE(), 1);

        variable.isArray = Boolean(buffer.readUInt32LE());
        variable.arraySize = buffer.readUInt32LE();

        variable.isInitialized = Boolean(buffer.readUInt32LE());

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
        const elementType = buffer.readUInt32LE() as TriggerFileElementType;
        console.log(elementType);
        switch (elementType) {
            case TriggerFileElementType.Category:
                const category = readCategory(buffer);
                category.kind = elementType;
                triggerFile.categories.push(category);
                break;
            case TriggerFileElementType.GUI:
                break;
            case TriggerFileElementType.Comment:
                break;
            case TriggerFileElementType.Trigger:
                const trigger = readTrigger(buffer);
                trigger.kind = elementType;
                triggerFile.triggers.push(trigger);
                break;
            case TriggerFileElementType.Variable:
                // variables are already parsed adn saved above we dont need to change anyhting here
                buffer.readUInt32LE() // id
                buffer.readStringNT() // name
                buffer.readUInt32LE() // parent id
                break;
        }
    }

    console.log(triggerFile, buffer.readOffset);

    strict.equal(buffer.remaining(), 0);

    return triggerFile;
}

function readCategory(buffer: WarBuffer): TriggerCategory {
    const category = {} as TriggerCategory;

    category.id = buffer.readUInt32LE();
    category.name = buffer.readStringNT();
    category.isComment = Boolean(buffer.readUInt32LE());
    category.parentId = buffer.readUInt32LE();

    console.log(category);

    return category;
}

function readTrigger(buffer: WarBuffer): TriggerFileTrigger {
    const trigger = {} as TriggerFileTrigger;

    trigger.name = buffer.readStringNT();
    trigger.description = buffer.readStringNT();
    trigger.isComment = Boolean(buffer.readUInt32LE());
    trigger.id = buffer.readUInt32LE();
    trigger.isEnabled = Boolean(buffer.readUInt32LE());
    trigger.isScript = Boolean(buffer.readUInt32LE()); // TODO throw on is script
    trigger.isInitiallyEnabled = Boolean(buffer.readUInt32LE());
    trigger.shouldRunOnInitialization = Boolean(buffer.readUInt32LE());
    trigger.parentId = buffer.readUInt32LE();

    // TODO ECA
    buffer.readArray(readECA);

    console.log(trigger);

    return trigger;
}

function readECA(buffer: WarBuffer, child: boolean = false): TriggerFileTriggerECA {
    const eca = {} as TriggerFileTriggerECA;
    if(child) {
        eca.parent = buffer.readUInt32LE();
    }
    eca.kind = buffer.readUInt32LE(); // TODO enum
    eca.name = buffer.readStringNT();
    eca.isEnabled = buffer.readBool(); // TODO really a bool?
    eca.parameters = buffer.readArray(readParameter);
    eca.children = Array.from({length: buffer.readUInt32LE()}, () => readECA(buffer, true));
    return eca;
}

function readParameter(buffer: WarBuffer): TriggerFileTriggerECAParameter {
    const parameter = {} as TriggerFileTriggerECAParameter; // TODO type

    // parameter.kind = buffer.readUInt32LE();
    // parameter.value = buffer.readStringNT();
    // parameter.hasSubParameter = buffer.readBool();

    // if(parameter.hasSubParameter) {
    //     const subParameter = {} as TriggerFileTriggerECASubParameter;
    //     subParameter.kind = buffer.readUInt32LE();
    //     subParameter.name = buffer.readStringNT();
    //     subParameter.hasParameters = buffer.readBool();
    //     if (subParameter.hasParameters) {
    //         subParameter.parameters = buffer.readArray();
    //     }
    // }

    // console.log(buffer.readUInt32LE()); // TODO unknown
    // parameter.isArray = buffer.readBool();

    // if (parameter.isArray) {
	// 	parameter.default = readParameter(buffer);
	// }
    
    return parameter;
}
