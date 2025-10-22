import {A,E,O,Q} from 'https://aeoq.github.io/AEOQ.mjs'
class Stat extends O {
    constructor(stats = {}) {
        super(new O(Stat.zero).add(new O(stats)));
    }
    get TA () {
        let {A, SA, CAC, CAD, MP, D, SD, V, HP} = new O([...this]);
        return (1 + CAC/100*(.2 + CAD/100)) * (.8*A + .5926*(A+SA)*(1+MP/100)) + .7*D + .14*SD + .7*V*(1 + HP/100);
    }
    add (...stats) {
        return new Stat(super.add(...stats));
    }
    minus (...stats) {
        return new Stat(super.minus(...stats));
    }
    static props = ['A','D','CAC','V','CAD','CAR','SA','SD','MP','HP','HSC','CR','HS','GP','TR','BAD']
    static zero = Stat.props.reduce((obj, prop) => ({...obj, [prop]: 0}), {});
    static decimals = ['CAC','CAD','HP','MP','CR','TR','CAR','GP','HSC','BAD'];
    static round = ({prop, value}) => value.toFixed(Stat.decimals.includes(prop) ? 2 : 0);
    static update = () => {
        let runes = Stat.runes();
        Q('input[type=number]', input => input.nextElementSibling.value = runes[input.name]);
        let TA = Stat.baseNrune();
        Q('#stats output').value = Math.round(TA);
        Q('#stats h2 data').value = TA - Stat.base();
        return true;
    }
    static base = () => new Stat(Form.base.values()).TA;
    static runes = (equipped, base = false) => new Stat(base ? Form.base.values() : null)
        .add(...Object.values(equipped ?? Runes.equipped()).map(rune => rune.rune.stats))
        .add(...Runes.equipped.sets().map(s => Rune.set.effect[s]));
    static baseNrune = equipped => Stat.runes(equipped, true).TA;
}
const Damage = ({A, SA, CAC, CAD, BAP, BAD, HSC, HS: HSD, TD, TR, Lv, enemyLv, coef, buffs}, def, special = false) => {
    CAC += buffs?.CAC || 0; CAD += buffs?.CAD || 0; BAD += buffs?.BAD || 0;
    def = {...def}; def.SD /= 100; def.HSD &&= def.HSD / 100; def.NHSAD /= 100; def.HSAD &&= def.HSAD / 100;
    buffs.A /= 100; 

    special == 'normal' && (special = false);
    let NTD = Math.max(TD - TR, 0)/100;
    let seniority = Math.max(Lv - enemyLv - 5, 0);

    let HS = {
        c: HSC/100,
        d: HSD * (1 + buffs.HS/100) * (1 - NTD) * (1 - special) / (1 + (def.HSD || 0))
    };
    let CA = {
        c: Math.min(1, Math.max(CAC/100, 0)),
        m: Math.max(1, 1.5 + CAD/100)
    };
    let BA = {
        c: BAP/100,
        m: Math.max(1, 1.3 + BAD/100)
    };
    let base = Damage[special ? 'special' : 'normal'](A, SA, coef, NTD, seniority, buffs, {SD: def.SD});
    let matrix;
    if (special) {
        matrix = [
            base,        null, base * CA.m,        null, 
            base * BA.m, null, base * BA.m * CA.m, null, 
        ];
    } else if (def.HSD) {
        base /= (1 + def.NHSAD);
        matrix = [
            base,        base + HS.d,        base * CA.m,        base * CA.m + HS.d, 
            base * BA.m, base * BA.m + HS.d, base * BA.m * CA.m, base * BA.m * CA.m + HS.d, 
        ];
    } else {
        matrix = [
            base / (1 + def.NHSAD),        (base + HS.d) / (1 + def.HSAD),        base * CA.m / (1 + def.NHSAD),        (base * CA.m + HS.d) / (1 + def.HSAD),
            base * BA.m / (1 + def.NHSAD), (base * BA.m + HS.d) / (1 + def.HSAD), base * BA.m * CA.m / (1 + def.NHSAD), (base * BA.m * CA.m + HS.d) / (1 + def.HSAD)
        ];
    }
    let classes = [CA.c === 0 ? 'no-CA' : CA.c === 1 ? 'all-CA' : '', HS.d === 0 ? 'no-HS' : '', BA.c === 0 ? 'no-BA' : ''].filter(c => c);
    return [...matrix, Damage.average(matrix, special ? 0 : HS.c, CA.c, BA.c), classes.join(' ')];
}
Object.assign(Damage, {
    normal: (A, SA, coef, NTD, seniority, buffs) =>
        A * .0168 * coef * (1 + buffs.A) * (1 + seniority/50) * (1 - NTD),

    special: (A, SA, coef, NTD, seniority, buffs, def) =>
        (A + SA) * .005469 * coef / (1 + def.SD) * (1 + buffs.A) * (1 + seniority/50) * (1 - NTD),

    average: ([A, HSA, CA, CHSA, BA, HSBA, CBA, CHSBA], HSc, CAc, BAc) =>
            A*(1-HSc)*(1-CAc)*(1-BAc) +   HSA*(HSc)*(1-CAc)*(1-BAc)
        +  CA*(1-HSc)*  (CAc)*(1-BAc) +  CHSA*(HSc)*  (CAc)*(1-BAc)
        +  BA*(1-HSc)*(1-CAc)*  (BAc) +  HSBA*(HSc)*(1-CAc)*  (BAc)
        + CBA*(1-HSc)*  (CAc)*  (BAc) + CHSBA*(HSc)*  (CAc)*  (BAc)
});
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
            target.title ? Stat.round({prop: target.title, value: Math.abs(value)}) : 
            Math.abs(value).toFixed(0);
        setTimeout(() => target.classList.remove('done'));
    }))
}
export {Stat, Damage, Data}
