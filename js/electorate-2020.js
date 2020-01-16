"use strict";

window.cap = function(s) { return s.charAt(0).toUpperCase().concat(s.slice(1)); };
window.mod = (n, m) => ((n % m) + m) % m;

async function load_data() {
    let electorate = await d3.csv("/data/electorate/sample.csv", d3.autoType);
    //electorate = d3.shuffle(electorate);
    window.electorate = electorate;
}

async function main() {
    let container = document.getElementById("profile");
    doT.templateSettings.varname = "d";
    let template = document.getElementById("template").innerHTML;
    let make_profile = doT.template(template);
    window.mp = make_profile;

    await load_data();
    let N = electorate.length;
    let ctr = -1;
    window.d = electorate[0];

    let next_profile = function() {
        ctr = mod(ctr + 1, N);
        container.innerHTML = make_profile(electorate[ctr]);
        d3.select("#next-profile").on("click", next_profile);
        d3.select("#prev-profile").on("click", prev_profile);
    };
    let prev_profile = function() {
        ctr = mod(ctr - 1, N);
        container.innerHTML = make_profile(electorate[ctr]);
        d3.select("#next-profile").on("click", next_profile);
        d3.select("#prev-profile").on("click", prev_profile);
    };

    next_profile();
    container.style.visibility = "visible";

}

main();
