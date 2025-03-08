import {A,E,O,Q} from 'https://aeoq.github.io/AEOQ.mjs'
import {PointerInteraction} from 'https://aeoq.github.io/pointer-interaction/script.js'
const Menu = () => {
    document.fonts.ready.then(Menu.align);
    PointerInteraction.events({
        'menu>li:has(ol)': {
            press (PI) {
                PI.$press.menuWidth = PI.target.Q('ol').clientWidth - 1;
                PI.$press.bullseye = E(PI.target.closest('div')).getBoundingPageRect().x;
            },
            drag (PI) { 
                PI.drag.to.translate({x: {max: PI.$press.menuWidth}, y: false});
                PI.drag.to.select({x: PI.$press.bullseye}, [PI.target.Q('ol li')].flat());
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
        this.attachShadow({mode: 'open'}).append(E('img'), E('style', this.css));
    }
    connectedCallback() {
        this.sQ('img').src = Icon.others[this.prop] ? `/rune/set/${Icon.others[this.prop]}.webp` : `/property.jpg`;
    }
    css = `
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
        ${Icon.sequence.map((p, i) => `:host([prop=${p}]) img[src$='property.jpg'] {object-position:0 ${100/13*i}%;}`).join('')}
    `;
    static sequence = ['A','D','V','TR','SA','CAC','CAD','MP','HP','CR','CAR','SD','HS','GP'];
    static en = {A:'Attack',D:'Defense',V:'Vitality',SA:'Special attack',SD:'Special defense',CAC:'Critical attack/strike chance',CAD:'Critical attack/strike damage',CAR:'Critical attack/strike resistance',HP:'HP recovery',MP:'MP recovery',TR:'Taint resistance',CR:'Counter resistance/defense',GP:'GP gain',HS:'Hell spear (damage)',HSC:'Hell spear chance',BAD:'Back attack damage'};
    static zh = {A:'攻擊力',D:'防禦力',V:'生命力',SA:'必殺攻擊力',SD:'必殺防禦力',CAC:'暴擊率',CAD:'暴擊傷害',CAR:'暴擊抵抗',HP:'HP 回復',MP:'MP 回復',TR:'侵蝕抵抗',CR:'克制抵抗',GP:'GP 獲得',HS:'地獄之矛 (傷害)',HSC:'地獄之矛率',BAD:'背擊傷害'};
    static others = {HSC:'javelin',HS:'roar',CAD:'doom',HP:'recovery',TR:'resist',EXP:'grow',BAD:'fight'};
    get prop() {return this.getAttribute('prop');}
    set prop(prop) {this.setAttribute('prop', prop);}
    set no(bool) {bool && this.setAttribute('no', '');}
    set level(level) {this.setAttribute('level', level);}
}
customElements.define("prop-icon", Icon);
export {Menu, Icon}