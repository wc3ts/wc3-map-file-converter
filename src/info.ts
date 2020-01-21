import { WarBuffer } from './warbuffer';

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
    loadingScreen: {
        number: number;
        model: string;
        text: string;
        title: string;
        subtitle: string;
    };

    // TODO clean up
    gameDataSet: number;
    prologueText: string;
    prologueTitle: string;
    prologueSubtitle: string;
    fogStyle: number;
    fogStartZHeight: number;
    fogEndZHeight: number;
    fogDensity: number;
    fogColor: number[];
    weatherId: string;
    customSoundEnvironment: string;
    customLightTileset: number;
    waterColor: number[];
    prologueScreenModel: string;

    lua: boolean;

    players: any[]; // TODO fix
}

export interface Location {
    x: number;
    y: number;
}

export interface Area {
    height: number;
    width: number;
}

export interface Player {
    number: number;
    type: number,
    race: number,
    fixedStartLocation: boolean,
    name: string,
    startLocation: Location
}

export function read(buffer: WarBuffer): Info {
    const version = buffer.readInt32LE();
    const mapVersion = buffer.readInt32LE();
    const editorVersion = buffer.readInt32LE();
    const gameVersion = {
        major: buffer.readInt32LE(),
        minor: buffer.readInt32LE(),
        patch: buffer.readInt32LE(),
        build: buffer.readInt32LE(),
    };
    // console.log(version, mapVersion, editorVersion, gameVersion);

    const info = {} as Info;
    info.name = buffer.readStringNT();
    info.author = buffer.readStringNT();
    info.description = buffer.readStringNT();
    info.suggestedPlayers = buffer.readStringNT();
    info.cameraBounds = Array.from({ length: 8 }, () => buffer.readFloatLE());
    info.cameraComplements = Array.from({ length: 4 }, () => buffer.readInt32LE());
    info.playableWidth = buffer.readUInt32LE();
    info.playableHeight = buffer.readUInt32LE();
    info.flags = buffer.readUInt32LE(); // TODO break down into values

    buffer.readBuffer(1); // TODO tileset

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
    info.fogColor = Array.from({ length: 4 }, () => buffer.readUInt8());

    info.weatherId = buffer.readBuffer(4).toString();
    info.customSoundEnvironment = buffer.readStringNT();
    info.customLightTileset = buffer.readUInt8();
    info.waterColor = Array.from({ length: 4 }, () => buffer.readUInt8());

    info.lua = buffer.readUInt32LE() === 1;

    info.players = Array.from({ length: buffer.readUInt32LE() }, () => {
        const player = {} as any;
        player.internal_number = buffer.readUInt32LE();
        player.type = buffer.readUInt32LE();
        player.race = buffer.readUInt32LE();
        buffer.readBuffer(4); // TODO unknown
        buffer.readBuffer(4); // TODO unknown
        player.fixed_start_position = buffer.readUInt32LE() === 1;
        player.name = buffer.readStringNT();
        player.starting_position_x = buffer.readFloatLE();
        player.starting_position_y = buffer.readFloatLE();
        buffer.readBuffer(4); // TODO ally low priorities flags
        buffer.readBuffer(4); // TODO ally high priorities flags
        return player;
    });

    // TODO available upgrades

    // TODO available tech

    // TODO random unit tables

    return info;
}
