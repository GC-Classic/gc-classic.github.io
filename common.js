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
const E = (el, childORattr, attr) => {
    attr = childORattr?.constructor == Object ? childORattr : attr;
    childORattr = [String, Number, Array].includes(childORattr?.constructor) ? [childORattr].flat() : [];
    el = Object.assign(document.createElement(el), attr ?? {});
    el.append(...childORattr);
    return el;
}
E.strTOobj = (s, which) => Object[which](s.constructor == Object ? s : {[s]: s})[0];
E.fieldsets = {
    radio: obj => Object.entries(obj).map(([attr, inputs]) =>
        E('fieldset', [
            E('legend', [...E.inputNlabel(attr, { type: 'radio', name: attr, id: attr, checked: true })]),
            ...inputs.flatMap(s => E.inputNlabel(E.strTOobj(s, 'values'), { type: 'radio', name: attr, title: E.strTOobj(s, 'keys'), id: `${attr}-${E.strTOobj(s, 'keys')}` }))
        ])
    ),
    checkbox: obj => {
        let fieldsets = Object.entries(obj).map(([attr, inputs]) =>
            E('fieldset', [
                E('legend', [...E.inputNlabel(attr, { type: 'checkbox', id: attr, checked: true })]),
                ...inputs.flatMap(s => E.inputNlabel(E.strTOobj(s, 'values'), { type: 'checkbox', title: E.strTOobj(s, 'keys'), id: `${attr}-${E.strTOobj(s, 'keys')}` }))
            ])
        );
        fieldsets.forEach(f => f.Q('input', input => input.addEventListener('change', () => {
            if (input.matches('legend input')) 
                return input.checked ? f.Q('legend~input', input => input.checked = false) : input.checked = true;
            f.Q('legend input').checked = ![...f.querySelectorAll('legend~input')].some(input => input.checked);
        })));
        return fieldsets;
    }
}
E.inputNlabel = (icon, {title, ...attr}) => [E('input', attr), E('label', [icon], {htmlFor: attr.id, ...title ? {title} : {}})];
const Error = message => {
    Q('aside p[style]')?.removeAttribute('style');
    Q(`#${message}`).style.display = 'block';
    Q('aside').classList.add('remind');
    clearInterval(Error.timer);
    Error.timer = setTimeout(() => Q('aside').classList.remove('remind'), 3000);
}
const Delta = {
    observe: tree => tree.Q('.delta,.boost', data => Delta.observer.observe(data, {attributeFilter: ['value']})),
    observer: new MutationObserver(mus => mus.forEach(({target}) => {
        if (target.classList.contains('done')) return;
        target.classList.remove('posi', 'nega');
        let value = parseFloat(target.value);
        target.classList.add('done', value > 0 ? 'posi' : value < 0 ? 'nega' : '_');
        target.value = target.title ? Stats.round({prop: target.title, value: Math.abs(value)}) : Math.abs(value).toFixed(0);
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
        ['runes', 'characters', 'damage', 'meta'].forEach(s => DB.db.createObjectStore(s, {autoIncrement: ['characters', 'damage'].includes(s)}));
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
    show: store => DB.open().then(() => DB.getAll(store)).then(entries => entries.length ? entries.forEach(([i, entry]) => Calculator.add({id: i, ...entry})) : Calculator.add())
}
const Menu = () => {
    document.fonts.ready.then(Menu.align);
    Menu.events();
}
Object.assign(Menu, {
    align: () => Q('menu').style.left = `-${Math.max(...[...document.querySelectorAll('menu ul')].map(ul => ul.clientWidth))}px`,
    events: () => Q('menu>li:has(ul)', el => el.onpointerdown = Menu.press),
    
    press: ({ target: dragged, clientX: startX }) => {
        dragged = dragged.closest('li');
        dragged.style.transition = null;
        let stops = [...dragged.querySelectorAll('li')].reverse().map(li => li.clientWidth).map((sum = 30, w => sum += w));
        document.onpointermove = document.ontouchmove = ev => Menu.drag(ev, startX, dragged, stops);
        document.onpointerup = document.ontouchend = ev => Menu.lift(dragged);
    },
    drag: (ev, startX, dragged, stops) => {
        ev.preventDefault();
        let distance = Math.min((ev.clientX || ev.targetTouches?.[0].pageX) - startX, dragged.Q('ul').clientWidth, stops.at(-1));
        if (distance <= 0 || !distance) return;
        dragged.style.transform = `translateX(${distance}px)`;
        dragged.Q(`li:nth-child(${stops.length - stops.findIndex(w => distance <= w)})`).Q('input').checked = true;
    },
    lift: dragged => {
        document.onpointermove = document.ontouchmove = document.onpointerup = document.ontouchend = dragged.style.transform = null;
        dragged.style.transition = 'transform .5s';
        Menu.action?.(dragged);
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
    static decimals = ['CAC','CAD','HP','MP','CD','TR','CAR','GP'];
    static round = ({prop, value}) => Stats.decimals.includes(prop) ? value.toFixed(2) : value.toFixed(0);
    static sample = {A:15000,HP:30,D:8000,MP:50,V:8000,GP:1,SA:8000,HS:24,SD:900,CAR:30,CAC:50,TR:12,CAD:400,CD:30}
    static order = ['A','D','V','SA','SD','CAC','CAD','CD','HP','MP','GP','HS','CAR','TR']
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
        }
        :host([prop=BAD]) {transform:rotate(90deg);}
        img {margin:auto;}
        img[src*='/set/'] {
            width:.8em; height:.8em; object-fit:contain;
            padding:.1em;
            filter:saturate(0) brightness(9);
        }
        img[src$='property.jpg'] {
            width:1em; height:1em; object-fit:cover;
            border-radius:9em;
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
        :host([tips])::before,:host([tips])::after {
            position:absolute; left:50%; transform:translateX(-50%);
            white-space:initial; line-height:.7rem;
        }
        :host([tips]:lang(en))::before,:host([tips])::after {
            font-size:.6em; width:4em;
        }
        :host([tips]:lang(zh))::before {
            font-size:.54em; width:5em;
        }
        :host([tips]:nth-child(2n))::before,:host([tips]:nth-child(2n+1))::after {bottom:110%;}
        :host([tips]:nth-child(2n+1))::before,:host([tips]:nth-child(2n))::after {top:110%;}
        ${Icon.sequence.map((p, i) => `:host([prop=${p}]) img[src$='property.jpg'] {object-position:0 ${100/13*i}%;}`).join('')}
        </style>`;
    }
    connectedCallback() {
        this.shadowRoot.Q('img').src = Icon.others[this.getAttribute('prop')] ? 
            `/rune/set/${Icon.others[this.getAttribute('prop')]}.webp` : `/property.jpg`;
    }
    attributeChangedCallback(_, before, after) {
        ['en','zh'].forEach(lang => this.setAttribute(lang, Icon[lang][this.getAttribute('prop')] ?? ''));
    }
    static sequence = ['A','D','V','TR','SA','CAC','CAD','MP','HP','CD','CAR','SD','HS','GP'];
    static en = {A:'attack', D:'defense', V:'vitality', SA:'special attack', SD:'special defense', CAC:'critical attack chance', CAD:'critical attack damage', CAR:'critical attack resistance', HP:'HP recovery', MP:'MP recovery', TR:'taint resistance', CD:'counter defense', GP:'GP gain', HS:'hell spear'};
    static zh = {A:'攻擊力', D:'防禦力', V:'生命力', SA:'必殺攻擊力', SD:'必殺防禦力', CAC:'暴擊率', CAD:'暴擊傷害', CAR:'暴擊抵抗', HP:'HP 回復', MP:'MP 回復', TR:'侵蝕抵抗', CD:'克制抵抗', HS:'地獄之矛', GP:'GP 獲得'};
    static others = {HSC:'javelin', HS:'roar', CAD:'doom', HP:'recovery', TR:'resist',EXP:'grow',BAD:'fight'};
    static observedAttributes = ['tips'];
    set prop(prop) {this.setAttribute('prop', prop);}
    set tips(_) {this.setAttribute('tips', '');}
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
