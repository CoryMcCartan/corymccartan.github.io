const est_url = "https://corymccartan.github.io/senate/estimate.json";
const hist_url = "https://corymccartan.github.io/senate/history.csv";
const race_hist_url = "https://corymccartan.github.io/senate/race_history.csv";
const poll_url = "https://corymccartan.github.io/senate/polls.csv";
const sims_url = "https://corymccartan.github.io/senate/sims.json";

let fetch_opts = {cache: "reload"};

let toDate = d => new Date(d + "T02:00:00-04:00");

async function main() {
    let estimates = await (await fetch(est_url, fetch_opts)).json();
    estimates.natl_intent = estimates.natl_intent.map(d => {
        d.date = toDate(d.date);
        return d;
    });
    estimates.races.map(d => {
        if (d.prob >= 0.95) d.rating = -3;
        else if (d.prob >= 0.8) d.rating = -2;
        else if (d.prob >= 0.65) d.rating = -1;
        else if (d.prob >= 0.35) d.rating = -0;
        else if (d.prob >= 0.2) d.rating = 1;
        else if (d.prob >= 0.05) d.rating = 2;
        else d.rating = 3;
    });
    window.estimates = estimates;

    fill_summary(estimates);

    
    fetch(hist_url, fetch_opts)
        .then(r => r.text())
        .then(history => {
            window.hist = d3.csvParse(history)
                .map(d => {
                    d.date = toDate(d.date);
                    return d;
                });

            chart_line(hist, "#prob_history .chart", "prob", false, {
                ymin: 0.02, ymax: 0.98,
                hrule: 0.5,
                addl_left: 4,
                hrule_label: "EVEN",
                title: "Chances of winning the Senate",
                format: d3.format(".0%"),
                tooltip_format: pct,
                smooth: false,
                refl: 1,
            });
            chart_line(hist, "#seats_history .chart", "s", true, {
                title: "Projected Democratic seats",
                ymin: 40, ymax: 65,
                addl_left: 4,
                hrule: 50,
                pad: 0.1,
                smooth: false,
                hrule_label: "MAJORITY",
            });

            chart_line(hist, "#pv_history .chart", "natl", true, {
                title: "Projected generic ballot margin",
                addl_left: 4,
                hrule: 0.5,
                hrule_label: "EVEN",
                format: margin_rnd,
                tooltip_format: margin, 
                pad: 0.3,
                smooth: false,
            });

            $("#seats_history").style.display = "none";
            $("#pv_history").style.display = "none";

            chart_line(hist, "#pickup_history", "dem_pickup", true, {
                addl_left: 4,
                ymin: 0, ymax: 15,
                h: bigScreen ? 280 : 200,
                title: "Projected Democratic seat gain",
                halfwidth: true,
                hrule: 0.00001,
                hrule_label: "",
                //refl: 1,
            });
            chart_line(hist, "#pickup_history", "gop_pickup", true, {
                addl_left: 4,
                //ymin: 0, 
                ymin: 0, ymax: 15,
                h: bigScreen ? 280 : 200,
                title: "Projected Republican seat gain",
                halfwidth: true,
                hrule: 15,
                hrule_label: "",
                //refl: 1,
            });
        })

    chart_histogram(estimates, "#histogram");
    table_races(estimates.races, "#races");
    let key_races = estimates.races.slice(0).sort(
        (a, b) => d3.ascending(Math.abs(+a.margin), Math.abs(+b.margin)));

    fetch(poll_url, fetch_opts)
        .then(r => r.text())
        .then(raw => {
            window.polls = d3.csvParse(raw)
            .map(d => {
                d.date = toDate(d.date);
                return d;
            });

            chart_line(estimates.natl_intent, "#public_opinion", "natl", true, {
                title: bigScreen ? 
                    "Estimated and forecasted polling numbers" :
                    "Estimated polling numbers",
                hrule: 0.5,
                addl_left: 4,
                pts: polls.filter(p => p.national == "TRUE"),
                pts_key: "dem",
                dodge: true,
                //ymin: 0.45, ymax: 0.6,
                pad: 0.3,
                format: margin_rnd,
                tooltip_format: margin,
                today: Date.now(),
                hrule_label: "EVEN",
            });
        });


    fetch(race_hist_url, fetch_opts)
        .then(r => r.text())
        .then(history => {
            window.race_hist = d3.csvParse(history)
                .map(d => {
                    d.date = toDate(d.date);
                    return d;
                });

            let st_sel = d3.select("#race");
            st_sel.selectAll("option")
                .data(estimates.races)
                .enter().append("option")
                .attr("value", d => d.race)
                .text(d => d.race_name);
            st_sel.on("change", race_select);

            st_sel.node().value = key_races[0].race;
            race_select();
        });

    fetch(sims_url, fetch_opts)
        .then(r => r.json())
        .then(sims => {
            sims = d3.shuffle(sims);
            sims.map(s => {
                s.seats = 35 + s.dem.reduce((a, b) => a+b, 0);
            });

            window.sims = sims;
            window.sim_ctr = 0;
            $("#sim_elec").onclick = () => sim_election(sims);

            setup_filter_sim(sims, key_races, "#race_buttons");
        });

    table_firms(estimates.firm_effects, "#firms");

    d3.selectAll("#history_tabs .tabs a")
        .on("click", function(e) {
            d3.event.preventDefault();

            d3.selectAll("#history_tabs .tabs a")
                .classed("current", false);
            d3.selectAll("#history_tabs section")
                .style("display", "none");

            let link = d3.select(this);
            link.classed("current", true);
            d3.select("#" + link.node().href.split("#")[1])
                .style("display", "block");
        });
}

function fill_summary(raw_data) {
    let dside = raw_data.prob >= 0.5;
    let data = Object.assign({}, raw_data);
    if (!dside) {
        let old_5 = data.s_q05;
        data.s_q05 = 100 - data.s_q95;
        data.s_q95 = 100 - old_5;
        data.prob = 1 - data.prob;
    }
    let frac = probToText(data.prob);

    $(".banner > .text").innerHTML = `
        <p>The <b style="color: ${dside ? BLUE : RED};">
        ${dside ? "Democrats" : "Republicans"}</b> are expected to win
        <b>between ${Math.round(data.s_q05)} and ${Math.round(data.s_q95)}</b> 
        seats.</p> <p>They have a 
        <b>${frac} chance</b> of winning control of the Senate.</p>`;

    let date = new Date(data.time.replace(/\s/, "T") + "-04:00");
    let dateStr = date.toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
    let timeStr =  date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });
    timeStr = timeStr.slice(0, -2) + "T"; // convert PDT to PT
    $(".banner > .updated").innerText = `Last updated ${dateStr} at ${timeStr}.`;

    $("#prob_win").innerHTML = probToText(data.prob);
    $("#prob_tie").innerHTML = probToText(data.pr_tie);
    $("#n_polls").innerHTML = data.n_polls;
    $("#natl_prior").innerHTML = d3.format(".1%")(data.prior_natl_mean) + 
        " &pm; " + d3.format(".1%")(data.prior_natl_moe);
}

function race_select(val) {
    let st_sel = $("#race");
    if (!!val) st_sel.value = val;
    let abbr = st_sel.value;
    let name = st_sel.selectedOptions[0].innerHTML;
    let data = race_hist.filter(d => d.race == abbr);

    $("#selected_race").innerHTML = name;
    $("#race_inc").innerHTML = [" has a Republican incumbent",
        "'s race has no incumbent", 
        " has a Democratic incumbent"][+data.slice(-1)[0].inc + 1];

    if ("polls" in window) {
        let n_polls = polls.filter(p => p.national == "FALSE" && 
                          estimates.races[+p.race-1].race == abbr &&
                          (+p.date + 14*1000*3600*24) >= Date.now()).length
        let url_name = name == "Georgia (special)" ? "Georgia" : name;
        let url = ("https://projects.fivethirtyeight.com/polls/senate/" 
                   + url_name.toLowerCase().replace(/ /g, "-") + "/");
        switch (n_polls) {
            case 0:
                $("#race_polls").innerHTML = `There have been no polls 
                conducted in ${name} in the last two weeks.`; 
                break;
            case 1:
                $("#race_polls").innerHTML = `There has been <a target="_blank"
                href="${url}">one poll</a> 
                conducted in ${name} in the last two weeks.`; 
                break;
            default:
                $("#race_polls").innerHTML = `There have been <a target="_blank"
                href="${url}">${n_polls} polls</a> 
                conducted in ${name} in the last two weeks.`; 
                break;
        }
    }

    $("#race_history").innerHTML = "";
    chart_line(data, "#race_history", "prob", false, {
        ymin: 0, ymax: 1.05,
        addl_left: 4,
        hrule: 0.5,
        hrule_label: "EVEN",
        h: bigScreen ? 300 : 220,
        title: "Chances of winning " + name,
        format: d3.format(".0%"),
        tooltip_format: pct,
        halfwidth: true,
        refl: 1,
    });

    chart_line(data, "#race_history", "dem", true, {
        title: "Projected vote margin in " + name,
        ymin: Math.min(+data[0].dem_q05, 0.3),
        ymax: Math.max(+data[0].dem_q95, 0.7),
        addl_left: 4,
        hrule: 0.5,
        hrule_label: "EVEN",
        h: bigScreen ? 300 : 220,
        pts: polls.filter(p => p.national == "FALSE" && 
                          p.date >= toDate("2020-05-21") &&
                          estimates.races[+p.race-1].race == abbr),
        pts_key: "dem",
        halfwidth: true,
        format: margin_rnd,
        tooltip_format: margin,
    });
}


const abbrs = {"AK":"Alaska","AL":"Ala.","AR":"Ark.","AZ":"Ariz.","CA":"Calif.",
    "CO":"Colo.","CT":"Conn.","DC":"D.C.","DE":"Del.","FL":"Fla.","GA":"Ga.",
    "GA-S":"Ga. (spec.)",
    "HI":"Hawaii","IA":"Iowa","ID":"Idaho","IL":"Ill.","IN":"Ind.","KS":"Kan.",
    "KY":"Ky.","LA":"La.","MA":"Mass.","MD":"Md.","ME":"Me.","MI":"Mich.",
    "MN":"Minn.","MO":"Mo.","MS":"Miss.","MT":"Mont.","NC":"N.C.","ND":"N.D.",
    "NE":"Neb.","NH":"N.H.","NJ":"N.J.","NM":"N.M.","NV":"Nev.","NY":"N.Y.",
    "OH":"Ohio","OK":"Okla.","OR":"Ore.","PA":"Pa.","RI":"R.I.","SC":"S.C.",
    "SD":"S.D.","TN":"Tenn.","TX":"Tex.","UT":"Utah","VA":"Va.","VT":"Vt.",
    "WA":"Wash.","WI":"Wis.","WV":"W.Va.","WY":"Wyo."};

main();
