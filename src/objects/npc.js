import interpolateDescription from "../utils/interpolate-description";

export default class Npc {
    constructor (universe, inventory, node) {
        this._universe = universe;
        this._inventory = inventory;
        this._node = node;

        this._name = node.name;

        this._description = interpolateDescription(node.description);

        this._key = node.key;

        this._setupEvents(node);
    }

    get node () { return this._node; }

    get name () { return this._name; }

    get description () { return this._description; }
    
    get universe () { return this._universe; }

    get inventory () { return this._inventory; }

    get items () { return this._inventory.items; }

    get key () { return this._key; }

    // items
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

    _setupEvents(node) {
        const handledEvents = ['onPlayerEnter'];

        let event;
        for(event in handledEvents) {
            if (node[event] === undefined) {
                continue;
            }
            
            this.universe.events.on(event, () => {
                
            });
        }
        if (node.onPlayerEnter) {

        }

    }
}