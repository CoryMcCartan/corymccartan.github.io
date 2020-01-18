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
    window.ctr = 0;
    let scrollTo = -1;
    let cells = {};
    let dem_scale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#edea", "#67fa"]);
    let gop_scale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#edea", "#e54a"]);
    let bip_scale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#c5c0", "#c5ca"]);

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

        if (innerWidth <= 550) {
            d3.selectAll("#vitals").html(function() {
                return this.innerHTML.replace(/&nbsp;/g, "");
            });
        }

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

        let nat_pct = function(d) {
            let [supp, total] = electorate.reduce((a, b) => {
                if (!!b[d]) return [a[0]+(b[d]==1), a[1]+1];
                else return a;
            }, [0, 0]);
            return supp / total;
        };
        let nat_color = function(d) {
            if (dem_line[d.id] == gop_line[d.id]) {
                if (dem_line[d.id] == 1)
                    return bip_scale(d.pct);
                else
                    return bip_scale(1-d.pct);
            } else {
                if (dem_line[d.id] == 1 && d.pct >= 0.5)
                    return dem_scale(d.pct);
                else if (dem_line[d.id] == 1 && d.pct < 0.5)
                    return gop_scale(d.pct);
                else if (dem_line[d.id] == 2 && d.pct < 0.5)
                    return dem_scale(d.pct);
                else
                    return gop_scale(d.pct);
            }
        };
        row.select("td#national")
            .datum(d => ({id: d, pct: nat_pct(d)}))
            .text(d => f_pct(d.pct))
            .style("background-color", nat_color);

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
