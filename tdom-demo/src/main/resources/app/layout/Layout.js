import template from "./Layout.html!tdom";
import domActions from '/lib/tdom/domActions.js';

export class Layout {

    constructor(rootEl) {
        this.el = rootEl;
        this.render();
    }

    render() {

		let df = template.call(this, domActions);
        this.el.appendChild(df);

    }

}