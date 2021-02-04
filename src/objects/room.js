import ChangeRoomAction from '../engine/game-actions/change-room';
import AllGameActions from '../engine/all-game-actions';

export default class Room {
    constructor (universe, inventory, node) {
        this._universe = universe;
        this._inventory = inventory;
        this._node = node;

        this._id = node.name;

        this._key = node.room;

        this._name = node.displayName;

        this._description = node.description;

        this._doors = [];
        this._npcs = [];
        this._eventTriggers = {};

        this._events = new Phaser.Events.EventEmitter();

        if (node.childrenNames) {
            node.childrenNames.forEach(child => {
                let matches = child.match(/^\[\[((door|item|npc|event)(?:-([^\-]+))+)\]\]$/i);
                const id = matches[1];
                const type = matches[2];

                switch (type.toLowerCase()) {
                    case 'door': // FORMAT: Door-<direction>-<id>
                        this._doors.push(universe.findDoor(id));
                        break;
                    case 'item': // FORMAT: Item-<id>
                        this._inventory.addItem(universe.findItem(id));
                        break;
                    case 'npc': // FORMATE: Npc-<id>
                        let npc = universe.findNpc(id);
                        npc.room = this;
                        this._npcs.push(npc);
                        break;
                    case 'event':
                        let eventTrigger = universe.findEventTrigger(id);

                        if (eventTrigger.event === undefined) {
                            throw new Error(`event is undefined in event trigger ${eventTrigger.id} for room ${this.id}`)
                        }

                        if (this._eventTriggers[eventTrigger.event] === undefined) {
                            this._eventTriggers[eventTrigger.event] = [];
                        }

                        this._eventTriggers[eventTrigger.event].push(eventTrigger);

                        break;
                }
            });
        }

        this._setupEvents();
    }

    // model info
    get node () { return this._node; }

    get id () { return this._id; }

    get key () { return this._key; }

    get name () { return this._name; }

    get description () { return this._description; }

    get universe () { return this._universe; }

    get events () { return this._events; }

    get eventTriggers () { return this._eventTriggers; }

    // npcs
    get npcs () { return this._npcs }

    findNpcByName (name) {
        console.log(this.npcs);    
        return (_.filter(this._npcs, npc => { return npc.key.match(new RegExp(name, 'i')); }))[0];
    }

    getNpcsDescription (firstNewLine = false) {
        let npcDescriptions = [];

        this.npcs.forEach(npc => {
            npcDescriptions.push('{{defaultDescription}} There is ' + npc.description + '.');
        });

        return npcDescriptions;
    }

    // doors
    get doors () { return this._doors }

    get exits () { return this.doors; }

    findDoorByDirection (direction) {
        return (_.filter(this.doors, door => { return door.direction === direction; }))[0];
    }

    get north () { return this.findDoorByDirection('north'); }

    get south () { return this.findDoorByDirection('south'); }

    get east () { return this.findDoorByDirection('east'); }

    get west () { return this.findDoorByDirection('west'); }

    get northeast () { return this.findDoorByDirection('northeast'); }

    get northwest () { return this.findDoorByDirection('northwest'); }

    get southeast () { return this.findDoorByDirection('southeast'); }

    get southwest () { return this.findDoorByDirection('southwest'); }

    get up () { return this.findDoorByDirection('up'); }

    get down () { return this.findDoorByDirection('down'); }

     // the room exits
    getExitsDescription (firstNewLine = false) {
        let exitDescriptions = [];

        this.exits.forEach(door => {
            exitDescriptions.push('{{defaultDescription}} There is ' + door.description + '.');
        });

        return exitDescriptions;
    }

    // items
    get inventory () { return this._inventory }

    get items () { return this.inventory.items; }

    findItemByName (name) { return this._inventory.findItem(name) }

    // the room inventory
    getInventoryDescription () {
        let itemDescriptions = [];

        this.items.forEach(item => {
            let itemLocation = this.node[item.name + '-Location'];

            itemDescriptions.push('{{defaultDescription}} There is ' + item.description + (itemLocation ? ' ' + itemLocation : '') + '.');
        });

        return itemDescriptions;
    }

    // the room description
    getGeneralDescription () {
        return this.name + '\n\n' + this.description;
    }

    // all descriptive details about a room
    get allDetails () {
        return {
            general: this.getGeneralDescription(),
            items: this.getInventoryDescription(),
            exits: this.getExitsDescription(),
            npcs: this.getNpcsDescription()
        };
    }

    // command methods
    commandLook () {
        let description = '{{defaultDescription}}' + this.allDetails.general;

        this.allDetails.items.forEach((item) => {
            description = description + ' ' + item;
        });

        this.allDetails.exits.forEach((exit) => {
            description = description + ' ' + exit;
        });

        this.allDetails.npcs.forEach((npc) => {
            description = description + ' ' + npc;
        });

        return description;
    };

    commandExits (firstNewLine = false) {
        let description = firstNewLine ? '\n' : '';
        description = description + this.getExitsDescription().join('\n');
        return description;
    };

    _directionCommand (direction) {
        let door = this.findDoorByDirection(direction);

        if (typeof door === 'undefined') {
            throw new Error('There doesn\'t seem to be anything in that direction');
        }

        return new ChangeRoomAction({
            room: door.room,
            direction: direction
        });
    }

    commandNorth () {
        return this._directionCommand('north');
    }

    commandSouth () {
        return this._directionCommand('south');
    }

    commandEast () {
        return this._directionCommand('east');
    }

    commandWest () {
        return this._directionCommand('west');
    }

    commandNorthEast () {
        return this._directionCommand('northeast');
    }

    commandNorthWest () {
        return this._directionCommand('northwest');
    }

    commandSouthEast () {
        return this._directionCommand('southeast');
    }

    commandSouthWest () {
        return this._directionCommand('southwest');
    }

    commandUp () {
        return this._directionCommand('up');
    }

    commandDown () {
        return this._directionCommand('down');
    }

    // event handling
    _setupEvents() {
        // 'onNorth', 'onSouth', 'onEast', 'onWest', 'onNortheast', 'onNorthwest', 'onSoutheast', 'onSouthwest', 'onUp', 'onDown'

        Object.keys(this.eventTriggers).forEach(event => {
            this.events.on(event, (data, rgi, room, universe) => {
                let actions = _.map(this.eventTriggers[event], eventTrigger => {
                    return new AllGameActions().createAction(eventTrigger.type, eventTrigger.data);
                });

                rgi.executeActions(actions, room, universe);
            });
        });
    }
}
