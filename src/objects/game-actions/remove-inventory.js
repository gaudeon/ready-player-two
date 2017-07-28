import GameAction from '../game-action';

export default class RemoveInventoryAction extends GameAction {
    constructor (data) {
        super(data);

        this._type = 'remove-inventory';

        if (!this.data.target) {
            throw new Error('target not defined')
        }

        this._target = this.data.target;

        if (this.data.items.length <= 0) {
            throw new Error('items not defined');
        }

        this._items = this.data.items;
    }

    get target () { return this._target; }

    get items () { return this._items; }

    run (rgi, buffer, room, player, lastCommand) {
        this.items.forEach(item => {
            this.target.inventory.removeItem(item);
        });
    }
}
