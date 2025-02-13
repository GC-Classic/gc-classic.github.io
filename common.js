navigator.serviceWorker.register('/worker.js');
HTMLDataElement.prototype.add = function(value) {this.value = parseFloat(this.value) + value;}
const Cookie = {
    ...Object.fromEntries(document.cookie.split(/;\s?/).map(c => c.split('=')).map(([k, v]) => [k, v?.includes('{') ? JSON.parse(v) : v])),
    set: (k, v) => document.cookie = `${k}=${typeof v == 'object' ? JSON.stringify(Cookie[k] = {...Cookie[k] ?? {}, ...v}) : v}; max-age=99999999; path=/`,
};
const Q = Node.prototype.Q = function(el, func) {
    let els = this.querySelectorAll?.(el) ?? document.querySelectorAll(el);
    return func ? els.forEach(func) : els.length > 1 ? [...els] : els[0];
}
Node.prototype.sQ = function(...args) {return this.shadowRoot.Q(...args);}

const E = (el, ...stuff) => {
    let [text, attr, children] = E.match(['String', 'Object', 'Array'], stuff);
    text && (attr = {textContent: text, ...attr ?? {}});
    el == 'img' && (attr &&= {alt: attr.src.match(/([^/.]+)(\.[^/.]+)$/)?.[1], onerror: ev => ev.target.remove(), ...attr ?? {}});
    el = ['svg', 'use', 'path'].includes(el) ? document.createElementNS('http://www.w3.org/2000/svg', el) : document.createElement(el);
    el.append(...children ?? []);
    Object.assign(el.style, attr?.style ?? {});
    Object.assign(el.dataset, attr?.dataset ?? {});
    return Object.assign(el, (({style, dataset, ...attr}) => attr)(attr ?? {}));
}
Object.assign(E, {
    prop: (prop, attr) => E('prop-icon', {prop, ...attr ?? {}}),
    bilingual: (...text) => (text.length === 1 ? text[0].split('|') : text).map(t => E('span', t)),

    input (...stuff) {
        let [attr, children] = E.match(['Object', 'Array'], stuff);
        attr ??= {}; children ??= [];
        let {input: order, title, ...others} = attr;
        return E('label', title ? {title} : '', order == 'last' ? [...children, E('input', others)] : [E('input', others), ...children]);
    },
    inputs: contents => contents.map(({children, ...attr}) => E.input(attr, [children ?? []].flat())),

    radio (...stuff) {
        let [attr, children] = E.match(['Object', 'Array'], stuff);
        return E.input({...attr ?? {}, type: 'radio'}, children);
    },
    radios: (contents, common) => contents.map(({children, ...attr}) => E.radio({...attr ?? {}, ...common}, [children ?? []].flat())),

    checkbox (...stuff) {
        let [attr, children] = E.match(['Object', 'Array'], stuff);
        return E.input({...attr ?? {}, type: 'checkbox'}, children);
    },    
    checkboxes: (contents, common) => contents.map(({children, ...attr}) => E.checkbox({...attr ?? {}, ...common ?? {}}, [children ?? []].flat())),

    match: (types, stuff) => types.map(t => stuff.find(s => Object.prototype.toString.call(s).includes(t)))
})
const Error = message => {
    Q('aside p[style]')?.removeAttribute('style');
    Q(`#${message}`).style.display = 'block';
    Q('aside').classList.add('remind');
    clearInterval(Error.timer);
    Error.timer = setTimeout(() => Q('aside').classList.remove('remind'), 3000);
}
const Data = {
    observe: (what) => what.Q('.post,.ante', data => Data.observer.observe(data, {attributeFilter: ['value']})),
    observer: new MutationObserver(mus => mus.forEach(({target}) => {
        let decimals = `${target.value}`.split('.')[1]?.length;
        if ((!decimals || decimals <= 2) && target.matches('.done') || target.value == '?') return;

        let value = parseFloat(target.value);
        target.classList.remove('posi', 'nega', '_');
        target.classList.add('done', value > 0 ? 'posi' : value < 0 ? 'nega' : '_');
        target.value = target.matches('.percent') ? 
            Math.abs(value).toFixed(2) :
            target.title ? Stats.round({prop: target.title, value: Math.abs(value)}) : 
            Math.abs(value).toFixed(0);
        setTimeout(() => target.classList.remove('done'));
    }))
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
        ['runes', 'characters', 'meta'].forEach(s => DB.db.createObjectStore(s, {autoIncrement: ['characters', 'damage'].includes(s)}));
        transaction.oncomplete = () => res(DB.db);
    }),
    store: (...args) => DB.db.transaction(...args).objectStore(args[0]),
    put: (store, obj) => new Promise(res => DB.store(store, 'readwrite').put(...Array.isArray(obj) ? obj.reverse() : [obj]).onsuccess = res),
    delete: (store, key) => new Promise(res => DB.store(store, 'readwrite').delete(key).onsuccess = res),
    get: (store, key) => new Promise(res => DB.store(store).get(key).onsuccess = ev => res(ev.target.result)),
    getAll: store => new Promise(res => {
        let runes = [];
        DB.store(store).openCursor().onsuccess = ev => {
            let {primaryKey, value} = ev.target.result ?? {};
            if (!primaryKey)
                return res(runes);
            runes.push([primaryKey, value])
            ev.target.result.continue();
        }
    }),
    show: (store = 'characters') => DB.open().then(() => DB.getAll(store))
        .then(entries => entries.length ? entries.forEach(([i, entry]) => Analyzer.add({id: i, ...entry})) : Analyzer.add()),
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
const Menu = () => {
    document.fonts.ready.then(Menu.align);
    Menu.events();
}
Object.assign(Menu, {
    align: () => Q('menu').style.left = `-${Math.max(...[...document.querySelectorAll('menu ol')].map(ol => ol.clientWidth))}px`,
    events: () => Q('menu>li:has(ol)', el => el.onpointerdown = Menu.press),
    
    press ({ target: dragged, clientX: startX }) {
        dragged = dragged.closest('li');
        dragged.style.transition = null;
        document.onpointermove = document.ontouchmove = ev => Menu.drag(ev, startX, dragged);
        document.onpointerup = document.ontouchend = ev => Menu.lift(dragged);
    },
    drag (ev, startX, dragged) {
        ev.preventDefault();
        let ol = dragged.Q('ol');
        let stops = [0, ...[...ol.children].reverse().map(li => li.clientWidth)].map((sum => w => sum += w)(32));
        let distance = Math.min((ev.clientX || ev.targetTouches?.[0].pageX) - startX, stops.at(-1));
        let checked = stops.findIndex(w => distance <= w);
        distance && (dragged.style.transform = `translateX(${distance}px)`);
        distance <= 0 || !distance || !checked ? 
            [ol.Q('input')].flat().forEach(input => input.checked = false) :
            [...ol.children].at(checked*-1).Q(`input`).checked = true;
    },
    lift (dragged) {
        document.onpointermove = document.ontouchmove = document.onpointerup = document.ontouchend = dragged.style.transform = null;
        dragged.style.transition = 'transform .5s';
        dragged.Q('ol :checked') && Menu.action?.(dragged);
    },
});
class Stats {
    constructor(stats) {
        Object.assign(this, stats ?? Stats.zero());
        let {A, SA, CAC, CAD, MP, D, SD, V, HP} = this;
        Object.defineProperties(this, {
            TA: {
                value: (1 + CAC/100*(.2 + CAD/100)) * (.8*A + .5926*(A+SA)*(1+MP/100)) + .7*D + .14*SD + .7*V*(1 + HP/100)
            },
            add: {
                value: (...stats) => new Stats([this, ...stats].reduce((sum, stat) => {
                    Object.keys(sum).forEach(p => sum[p] += stat?.[p] ?? 0); 
                    return sum;
                }, Stats.zero()))
            },
            minus: {
                value: (...stats) => this.add(stats.reduce((sum, stat) => {
                    Object.keys(sum).forEach(p => sum[p] -= stat?.[p] ?? 0); 
                    return sum;
                }, Stats.zero()))
            }
        });
    }
    static zero = () => Stats.order.reduce((obj, prop) => ({...obj, [prop]: 0}), {});
    static update = () => {
        let runes = Stats.runes();
        Q('input[type=number]', input => input.nextElementSibling.value = runes[input.name]);
        let TA = Stats.baseNrune();
        Q('#stats output').value = Math.round(TA);
        Q('#stats h2 data').value = TA - Stats.base();
        return true;
    }
    static base = () => new Stats(Form.base.values()).TA;
    static runes = (equipped, base = false) => new Stats(base ? Form.base.values() : null)
        .add(...Object.values(equipped ?? Runes.equipped()).map(rune => rune.rune.stats))
        .add(...Runes.equipped.sets().map(s => Rune.set.effect[s]));
    static baseNrune = equipped => Stats.runes(equipped, true).TA;
    static decimals = ['CAC','CAD','HP','MP','CR','TR','CAR','GP','HSC','BAD'];
    static round = ({prop, value}) => Stats.decimals.includes(prop) ? value.toFixed(2) : value.toFixed(0);
    static sample = {A:15000,HP:30,D:8000,MP:50,V:8000,GP:1,SA:8000,HS:24,SD:900,CAR:30,CAC:50,TR:12,CAD:400,CR:30}
    static order = ['A','D','CAC','V','CAD','CAR','SA','SD','MP','HP','HSC','CR','HS','GP','TR','BAD']
}
class Icon extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'}).innerHTML = `
        <img>
        <style>
        :host {
            display:inline-flex;
            position:relative;
            font-size:1rem;
        }
        :host([prop=BAD]) img {transform:rotate(-90deg);}
        img {
            margin:auto;

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
        ${Icon.sequence.map((p, i) => `:host([prop=${p}]) img[src$='property.jpg'] {object-position:0 ${100/13*i}%;}`).join('')}
        </style>`;
    }
    connectedCallback() {
        this.sQ('img').src = Icon.others[this.getAttribute('prop')] ? 
            `/rune/set/${Icon.others[this.getAttribute('prop')]}.webp` : `/property.jpg`;
    }
    static sequence = ['A','D','V','TR','SA','CAC','CAD','MP','HP','CR','CAR','SD','HS','GP'];
    static en = {A:'Attack',D:'Defense',V:'Vitality',SA:'Special attack',SD:'Special defense',CAC:'Critical attack/strike chance',CAD:'Critical attack/strike damage',CAR:'Critical attack/strike resistance',HP:'HP recovery',MP:'MP recovery',TR:'Taint resistance',CR:'Counter resistance/defense',GP:'GP gain',HS:'Hell spear (damage)',HSC:'Hell spear chance',BAD:'Back attack damage'};
    static zh = {A:'攻擊力',D:'防禦力',V:'生命力',SA:'必殺攻擊力',SD:'必殺防禦力',CAC:'暴擊率',CAD:'暴擊傷害',CAR:'暴擊抵抗',HP:'HP 回復',MP:'MP 回復',TR:'侵蝕抵抗',CR:'克制抵抗',GP:'GP 獲得',HS:'地獄之矛 (傷害)',HSC:'地獄之矛率',BAD:'背擊傷害'};
    static others = {HSC:'javelin', HS:'roar', CAD:'doom', HP:'recovery', TR:'resist',EXP:'grow',BAD:'fight'};
    static observedAttributes = ['tips'];
    get prop() {return this.getAttribute('prop');}
    set prop(prop) {this.setAttribute('prop', prop);}
    set no(bool) {bool && this.setAttribute('no', '');}
    set level(level) {this.setAttribute('level', level);}
}
customElements.define("prop-icon", Icon);
onhashchange = lang => {
    typeof lang != 'string' && (lang = location.hash.substring(1));
    Q('html').lang = lang;
    Q(`a.lang.located`)?.classList.remove('located');
    Q(`a[href='#${lang}']`)?.classList.add('located');
    Q('a[href]:not(.lang)', a => a.href = a.href.replace(/(#..)?$/, `#${lang}`));
    Q('legend label', label => label.replaceChildren(...Translate.group(label.htmlFor)));
    Q('label:is([for|=set])[title]', label => label.title = lang == 'zh' ? 
        Translate.text(label.htmlFor.split('-')[1]) : label.htmlFor.split('-')[1]
    );
    setTimeout(Q('menu') && Menu.align);
}
const DEMO = location.pathname != '/rune/simulator/';
const Translate = {
    group: id => Q('template').content.Q(`#${id}`).cloneNode(true).childNodes,
    text: id => Q('template').content.Q(`#${id}`).textContent
}
