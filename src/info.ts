import { WarBuffer, RGBA } from './warbuffer';
import { strict } from 'assert';

export interface Info {
    name: string;
    author: string;
    description: string;
    suggestedPlayers: string;
    cameraBounds: number[];
    cameraComplements: number[];
    playableWidth: number;
    playableHeight: number;
    flags: number;
    tileset: string;
    loadingScreen: {
        number: number;
        model: string;
        text: string;
        title: string;
        subtitle: string;
    };
    gameDataSet: number;
    prologueText: string;
    prologueTitle: string;
    prologueSubtitle: string;
    fogStyle: number;
    fogStartZHeight: number;
    fogEndZHeight: number;
    fogDensity: number;
    fogColor: RGBA;
    weatherId: string;
    customSoundEnvironment: string;
    customLightTileset: number;
    waterColor: RGBA;
    prologueScreenModel: string;
    scriptLanguage: number;
    supportedModes: number; // 1 = sd, 2 = hd, 3 = sd and hd
    gameDataVersion: number;
    players: Player[];
    forces: Force[];
    availableUpgrades: Upgrade[];
    availableTechnology: Technology[];
    randomUnitTables: RandomUnitTable[];
    randomItemTables: RandomItemTable[];
}

export interface Player {
    number: number;
    type: number,
    race: number,
    fixedStartLocation: boolean,
    name: string,
    startLocation: {
        x: number;
        y: number;
    };
    ally: {
        low: number;
        high: number;
    };
    enemy: {
        low: number;
        high: number;
    };
}

export interface Force {
    flags: number;
    players: number; // if bit number i is 1 the player i is part of this force
    name: string;
}

export interface Upgrade {
    players: number; // if bit number i is 1 this change applies for player i
    id?: string;
    level: number;
    availability: number;
}

export interface Technology {
    players: number;
    id?: string;
}

export interface RandomUnitTable {
    number: number; name: string;
    columns: number[];
    rows: any[];
}

export interface RandomItemTable {
    number: number;
    name: string;
    itemSets: any[][];
}

export function read(buff: Buffer): Info {
    const buffer = new WarBuffer({ buff });
    const version = buffer.readInt32LE();
    strict.equal(version, 31, 'Unknown info version');
    const mapVersion = buffer.readInt32LE();
    const editorVersion = buffer.readInt32LE();
    const gameVersion = {
        major: buffer.readInt32LE(),
        minor: buffer.readInt32LE(),
        patch: buffer.readInt32LE(),
        build: buffer.readInt32LE()
    };

    const info = {} as Info;
    info.name = buffer.readStringNT();
    info.author = buffer.readStringNT();
    info.description = buffer.readStringNT();
    info.suggestedPlayers = buffer.readStringNT();
    info.cameraBounds = Array.from({ length: 8 }, () => buffer.readFloatLE());
    info.cameraComplements = Array.from({ length: 4 }, () => buffer.readInt32LE());
    info.playableWidth = buffer.readUInt32LE();
    info.playableHeight = buffer.readUInt32LE();
    info.flags = buffer.readUInt32LE();
    info.tileset = buffer.readChar();

    info.loadingScreen = {
        number: buffer.readUInt32LE(),
        model: buffer.readStringNT(),
        text: buffer.readStringNT(),
        title: buffer.readStringNT(),
        subtitle: buffer.readStringNT(),
    };

    info.gameDataSet = buffer.readUInt32LE();

    info.prologueScreenModel = buffer.readStringNT();
    info.prologueText = buffer.readStringNT();
    info.prologueTitle = buffer.readStringNT();
    info.prologueSubtitle = buffer.readStringNT();

    info.fogStyle = buffer.readUInt32LE();
    info.fogStartZHeight = buffer.readFloatLE();
    info.fogEndZHeight = buffer.readFloatLE();
    info.fogDensity = buffer.readFloatLE();
    info.fogColor = buffer.readRGBA();

    info.weatherId = buffer.readBuffer(4).toString();
    info.customSoundEnvironment = buffer.readStringNT();
    info.customLightTileset = buffer.readUInt8();
    info.waterColor = buffer.readRGBA();

    info.scriptLanguage = buffer.readInt32LE();
    info.supportedModes = buffer.readInt32LE();
    info.gameDataVersion = buffer.readInt32LE();

    info.players = buffer.readArray(readPlayer);

    info.forces = buffer.readArray(readForce);
    info.availableUpgrades = buffer.readArray(readUpgrade);
    info.availableTechnology = buffer.readArray(readTechnology);
    info.randomUnitTables = buffer.readArray(readRandomUnitTable);
    info.randomItemTables = buffer.readArray(readRandomItemTable);

    strict.equal(buffer.remaining(), 0);

    return info;
}

function readPlayer(buffer: WarBuffer): Player {
    const player = {} as Player;
    player.number = buffer.readUInt32LE();
    player.type = buffer.readUInt32LE();
    player.race = buffer.readUInt32LE();
    player.fixedStartLocation = buffer.readBool();
    player.name = buffer.readStringNT();
    player.startLocation = {
        x: buffer.readFloatLE(),
        y: buffer.readFloatLE()
    };
    player.ally = {
        low: buffer.readUInt32LE(),
        high: buffer.readUInt32LE()
    };
    player.enemy = {
        low: buffer.readUInt32LE(),
        high: buffer.readUInt32LE()
    };

    return player;
}

function readForce(buffer: WarBuffer): Force {
    const force = {} as Force;
    force.flags = buffer.readUInt32LE();
    force.players = buffer.readUInt32LE();
    force.name = buffer.readStringNT();
    return force;
}

function readUpgrade(buffer: WarBuffer): Upgrade {
    const upgrade = {} as Upgrade;
    upgrade.players = buffer.readUInt32LE();
    upgrade.id = buffer.readFourCC();
    upgrade.level = buffer.readUInt32LE();
    upgrade.availability = buffer.readUInt32LE();
    return upgrade;
}

function readTechnology(buffer: WarBuffer): Technology {
    const technology = {} as Technology;
    technology.players = buffer.readUInt32LE();
    technology.id = buffer.readFourCC();
    return technology;
}

function readRandomUnitTable(buffer: WarBuffer): RandomUnitTable {
    const table = {} as RandomUnitTable;
    table.number = buffer.readUInt32LE();
    table.name = buffer.readStringNT();

    const numColumns = buffer.readUInt32LE();
    table.columns = Array.from({ length: numColumns }, () => buffer.readInt32LE());
    table.rows = buffer.readArray(() => {
        const row = {} as any;
        row.chance = buffer.readUInt32LE();
        row.ids = Array.from({ length: numColumns }, () => buffer.readFourCC());
        return row;
    });
    return table;
}

function readRandomItemTable(buffer: WarBuffer): RandomItemTable {
    const table = {} as RandomItemTable;
    table.number = buffer.readUInt32LE();
    table.name = buffer.readStringNT();
    table.itemSets = buffer.readArray(() => {
        return buffer.readArray(() => {
            const item = {} as any;
            item.chance = buffer.readUInt32LE();
            item.id = buffer.readFourCC();
            return item;
        });
    });
    return table;
}
