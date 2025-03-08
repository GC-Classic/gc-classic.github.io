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
            ol.Q('input', input => input.checked = false) :
            [...ol.children].at(checked*-1).Q(`input`).checked = true;
    },
    lift (dragged) {
        document.onpointermove = document.ontouchmove = document.onpointerup = document.ontouchend = dragged.style.transform = null;
        dragged.style.transition = 'transform .5s';
        dragged.Q('ol :checked') && Menu.action?.(dragged);
    },
});

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
export {Menu, Icon}