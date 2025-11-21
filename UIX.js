import {A,E,O,Q} from 'https://aeoq.github.io/AEOQ.mjs'
import PointerInteraction from 'https://aeoq.github.io/pointer-interaction/script.js'
const Menu = () => {
    document.fonts.ready.then(Menu.align);
    PointerInteraction.events({
        'menu>li:has(ol)': {
            press (PI) {
                PI.$press.menuWidth = PI.target.Q('ol').clientWidth - 1;
                PI.$press.bullseye = E(PI.target.closest('div')).getBoundingPageRect().x;
                PI.$press.items = [PI.target.Q('ol li')].flat();
            },
            drag (PI) { 
                PI.drag.to.translate({x: {max: PI.$press.menuWidth}, y: false});
                PI.drag.to.select({x: PI.$press.bullseye}).from(PI.$press.items);
                Q('.PI-selected input') && (Q('.PI-selected input').checked = true);
            },
            lift: () => Q('.PI-selected input') && Menu.action?.()
        }
    })
}
Menu.align = () => Q('menu').style.left = `-${Math.max(...[Q('menu ol')].flat().map(ol => ol.clientWidth))}px`

class Icon extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'}).append(E('img'));
        this.#css.then(css => this.shadowRoot.adoptedStyleSheets = [css]);
    }
    connectedCallback() {
        this.sQ('img').src = Icon.others[this.prop] ? `/rune/set/${Icon.others[this.prop]}.webp` : `/property.jpg`;
    }
    #css = new CSSStyleSheet().replace(`
    :host {
        display:inline-flex;
        font-size:1rem;
        position:relative;
    }
    img {
        margin:auto;
        
        :host([prop=BAD]) & {transform:rotate(-90deg);}
        &[src*='/set/'] {
            width:.8em; height:.8em; object-fit:contain;
            padding:.1em;
            filter:saturate(0) brightness(9);
        }
        &[src$='property.jpg'] {
            width:1em; height:1em; object-fit:cover;
            border-radius:9em;
        }
    }
    :host([level])::after {
        transform:translate(-.05em,.4em);
        line-height:0;
    }
    :host([level='1'])::after {content:"'";}
    :host([level='2'])::after {content:'"';}
    :host([no])::after {
        content:'';
        position:absolute; left:50%; top:50%;
        width:.1em; height:110%;
        border-left:.1em solid;
        transform:translate(-.05em,-50%) rotate(-45deg);
    }
    ${Icon.sequence.map((p, i) => `:host([prop=${p}]) img[src$='property.jpg'] {object-position:0 ${100/13*i}%;}`).join('')}`);
    static sequence = ['A','D','V','TR','SA','CAC','CAD','MP','HP','CR','CAR','SD','HS','GP'];
    static en = {A:'Attack',D:'Defense',V:'Vitality',SA:'Special attack',SD:'Special defense',CAC:'Critical attack/strike chance',CAD:'Critical attack/strike damage',CAR:'Critical attack/strike resistance',HP:'HP recovery',MP:'MP recovery',TR:'Taint resistance',CR:'Counter resistance/defense',GP:'GP gain',HS:'Hell spear (damage)',HSC:'Hell spear chance',BAD:'Back attack damage'};
    static zh = {A:'攻擊力',D:'防禦力',V:'生命力',SA:'必殺攻擊力',SD:'必殺防禦力',CAC:'暴擊率',CAD:'暴擊傷害',CAR:'暴擊抵抗',HP:'HP 回復',MP:'MP 回復',TR:'侵蝕抵抗',CR:'克制抵抗',GP:'GP 獲得',HS:'地獄之矛 (傷害)',HSC:'地獄之矛率',BAD:'背擊傷害'};
    static others = {HSC:'javelin',HS:'roar',CAD:'doom',HP:'recovery',TR:'resist',EXP:'grow',BAD:'fight'};
    get prop() {return this.getAttribute('prop');}
    set prop(prop) {this.setAttribute('prop', prop);}
    set no(bool) {bool && this.setAttribute('no', '');}
    set level(level) {this.setAttribute('level', level);}
}
customElements.define('prop-icon', Icon);

customElements.define('gc-item', class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'}).append(E('style', this.css), E('slot'));
    }
    connectedCallback() {
        E(this).set({
            '--sprite': `url(https://gc-classic.github.io/item/sprite/${Math.floor(this.id/100)*100}.png)`,
            '--x': 100 / 9 * (this.id % 10),
            '--y': 100 / 9 * Math.floor((this.id / 10) % 10)
        });
    }
    static observedAttributes = ['id']
    attributeChangedCallback() {this.connectedCallback();}
    css = `
    :host {
        display: inline-block; aspect-ratio: 1;
        background-image: var(--sprite), linear-gradient(var(--ibg, transparent),var(--ibg, transparent));
        background-size: 1000%;
        background-position: calc(1%*var(--x)) calc(1%*var(--y));
    }`
});

window.onhashchange = lang => {
    typeof lang != 'string' && (lang = location.hash.substring(1));
    Q('html').lang = lang;
    Q(`a.lang.located`)?.classList.remove('located');
    Q(`a[href='#${lang}']`)?.classList.add('located');
    //Q('a[href]:not(.lang)', a => a.href = a.href.replace(/(#..)?$/, `#${lang}`));
    setTimeout(Q('menu ol') && Menu.align);
}
const DB = {
    db: null,
    open: () => new Promise(res => {
        if (DB.db) return res(DB.db);
        let opening = indexedDB.open('GCC', 1);
        opening.onerror = er => console.error(er);
        opening.onsuccess = () => res((DB.db = opening.result).onerror = opening.onerror);
        opening.onupgradeneeded = () => DB.init(opening).then(res).catch(opening.onerror);
    }),
    init: ({result, transaction}) => new Promise(res => {
        DB.db = result;
        ['characters','runes'].forEach(s => DB.db.createObjectStore(s, {autoIncrement: true}));
        transaction.oncomplete = () => res(DB.db);
    }),
    store: (...args) => DB.db.transaction(...args).objectStore(args[0]),
    put: (store, obj) => new Promise(res => DB.store(store, 'readwrite').put(...Array.isArray(obj) ? obj.reverse() : [obj]).onsuccess = res),
    delete: (store, key) => new Promise(res => DB.store(store, 'readwrite').delete(key).onsuccess = res),
    get: (store, key) => new Promise(res => DB.store(store).get(key).onsuccess = ev => res(ev.target.result)),
    getAll: store => new Promise(res => {
        let runes = [];
        DB.store(store).openCursor().onsuccess = ev => {
            let {primaryKey: key, value} = ev.target.result ?? {};
            if (!key)
                return res(runes);
            runes.push([key, value])
            ev.target.result.continue();
        }
    }),
    export: a => a.download ? setTimeout(() => a.download = '') : DB.getAll('characters').then(content => {
        a.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(content.map(([, data]) => data)))}`,
        a.download = 'grand-chase-analyzer-data.json';
        a.click();
    }),
    import: a => {
        let reader = new FileReader();
        reader.readAsText(a.Q('input').files[0]);
        reader.onload = () => Promise.all(JSON.parse(reader.result).map(data => DB.put('characters', data))).then(() => location.reload());
    }
}
window.DB = DB;
export {Menu, Icon, DB}
