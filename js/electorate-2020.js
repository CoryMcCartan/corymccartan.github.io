"use strict";

window.cap = function(s) { return s.charAt(0).toUpperCase().concat(s.slice(1)); };
window.mod = (n, m) => ((n % m) + m) % m;
window.f_pct = d3.format(".0%");

async function load_data() {
    let electorate = await d3.csv("/data/electorate/sample.csv", d3.autoType);
    window.dem_line = electorate.filter(d => d.lname == "DEM")[0]
    window.gop_line = electorate.filter(d => d.lname == "GOP")[0]
    electorate = electorate.filter(d => d.lname != "DEM" && d.lname != "GOP");
    electorate = d3.shuffle(electorate);
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
    let ctr = 0;
    let scrollTo = -1;
    let cells = {};

    let next_profile = function() {
        ctr = mod(ctr + 1, N);
        scrollTo = cells._.findIndex(c => c.getBoundingClientRect().y >= innerHeight-20)-1;
        setup_profile();
    };
    let prev_profile = function() {
        ctr = mod(ctr - 1, N);
        scrollTo = cells._.findIndex(c => c.getBoundingClientRect().y >= innerHeight-20)-1;
        setup_profile();
    };
    let setup_profile = function() {
        let voter = electorate[ctr];
        window.d = voter;
        container.innerHTML = make_profile(voter);
        d3.select("#next-profile").on("click", next_profile);
        d3.select("#prev-profile").on("click", prev_profile);

        let questions = Object.keys(voter);
        let row = d3.selectAll(".issues tr")
            .data(questions, function(d) {
                console.log(d);
                return !!d ? d : this.id;
            });
        row.select("td#support")
            .text(d => voter[d] == 1 ? "\u2713" : "")
            .classed("agree", d => voter[d] == 1)
            .classed("dem", d => dem_line[d] == 1)
            .classed("gop", d => gop_line[d] == 1);
        row.select("td#oppose")
            .text(d => voter[d] == 2 ? "\u2713" : "")
            .classed("agree", d => voter[d] == 2)
            .classed("dem", d => dem_line[d] == 2)
            .classed("gop", d => gop_line[d] == 2);

        cells._ = Array.from(document.querySelectorAll("table.issues td"));
        if (scrollTo >= 0) {
            cells._[scrollTo].scrollIntoView(false);
            window.scrollBy(0, 4);
        }
    };
    setup_profile();


    d3.select("body").on("keydown", () => {
        if (d3.event.keyCode == 37) prev_profile();
        if (d3.event.keyCode == 39) next_profile();
    });
}

main();
