window.$ = s => document.querySelector(s);

let total_box = $("#total");
let sl_ir = $("#inf_rate");
let sl_scfr = $("#scfr");
let l_ir = $("#l_ir");
let l_scfr = $("#l_scfr");
let b_est_d = $("#est_deaths > b");
let b_pr_one = $("#prob_one > b");

let boxes = [
    $("#num_0009"),
    $("#num_1019"),
    $("#num_2029"),
    $("#num_3039"),
    $("#num_4049"),
    $("#num_5059"),
    $("#num_6069"),
    $("#num_7079"),
    $("#num_8000"),
];

const age_scfr = [0.0044, 0.0088, 0.0023, 0.0016, 0.0036, 0.0076, 
    0.0156, 0.0340, 0.06];
const nums =   [1,   1,  1,  1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 1, 2, 1]
const denoms = [100, 50, 40, 20, 15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 5, 2];

function probToText(prob) {
    if (prob < 0.005)
        return "<1 in 100";
    else if (prob > 0.995)
        return ">99 in 100";

    let p = Math.min(prob, 1 - prob);
    let dists = nums.map((n, i) => Math.abs(n/denoms[i] - p));
    let idx = dists.indexOf(Math.min.apply(null, dists));
    if (p == prob) 
        return `${nums[idx]} in ${denoms[idx]}`;
    else 
        return `${denoms[idx] - nums[idx]} in ${denoms[idx]}`;
}

function recalc() {
    let values = boxes.map(x => +x.value);
    total_box.innerHTML = d3.sum(values);

    let inf_rate = sl_ir.value/100;
    let scfr = sl_scfr.value/100;
    l_ir.innerHTML = sl_ir.value + "%";
    l_scfr.innerHTML = sl_scfr.value + "%";

    let adj_r = age_scfr.map(r => r * inf_rate*0.5 * scfr/0.014); 
    let age_d = values.map((x, i) => x*adj_r[i]);

    let est_d = d3.sum(age_d);
    b_est_d.innerHTML = Math.floor(est_d) + "&ndash;" + Math.ceil(est_d);
    let lp_none = values.map((x, i) => x * Math.log(1 - adj_r[i]));
    let pr_one = 1 - Math.exp(d3.sum(lp_none));
    b_pr_one.innerHTML = probToText(pr_one); 
}

function selectAll() {
    this.select();
}


boxes.map(x => { x.onchange = recalc; });
boxes.map(x => { x.onclick = selectAll; });
sl_ir.oninput = recalc;
sl_scfr.oninput = recalc;

recalc();
