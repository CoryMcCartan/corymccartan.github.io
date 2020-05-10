const est_url = "https://corymccartan.github.io/president/estimate.json";
const hist_url = "https://corymccartan.github.io/president/history.csv";
const state_hist_url = "https://corymccartan.github.io/president/state_history.csv";
const poll_url = "https://corymccartan.github.io/president/polls.csv";
const sims_url = "https://corymccartan.github.io/president/sims.json";
const prev_url = "https://corymccartan.github.io/president/prev_results.csv";

let fetch_opts = {cache: "reload"};

let toDate = d => new Date(d + "T02:00:00-04:00");

async function main() {
    let estimates = await (await fetch(est_url, fetch_opts)).json();
    estimates.natl_intent = estimates.natl_intent.map(d => {
        d.date = toDate(d.date);
        return d;
    });
    estimates.states.map(d => {
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

    let key_states = estimates.states.slice(0).sort(
        (a, b) => d3.descending(+a.tipping_pt, +b.tipping_pt));
    
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
                //h: bigScreen ? 280 : 200,
                title: "Chances of winning the presidency",
                format: d3.format(".0%"),
                tooltip_format: pct,
                smooth: false,
                refl: 1,
            });
            chart_line(hist, "#ev_history .chart", "ev", true, {
                title: "Biden’s projected electoral votes",
                ymin: 0, ymax: 538,
                addl_left: 4,
                hrule: 270,
                pad: 0.1,
                smooth: false,
                hrule_label: "270 TO WIN",
            });

            chart_line(hist, "#pv_history .chart", "natl", true, {
                title: "Projected popular vote margin",
                addl_left: 4,
                hrule: 0.5,
                hrule_label: "EVEN",
                format: margin_rnd,
                tooltip_format: margin, 
                pad: 0.2,
                smooth: false,
            });

            chart_line(hist, "#pop_ev_history", "prob_pop", false, {
                addl_left: 4,
                ymin: 0.02, ymax: 0.98,
                h: bigScreen ? 280 : 200,
                title: "Win popular vote",
                format: d3.format(".0%"),
                tooltip_format: pct,
                halfwidth: true,
                refl: 1,
            });
            chart_line(hist, "#pop_ev_history", "prob_pop_ev_DR", false, {
                addl_left: 4,
                ymin: 0, ymax: 0.28,
                series2: "prob_pop_ev_RD",
                h: bigScreen ? 280 : 200,
                title: "Win popular vote but lose presidency",
                format: d3.format(".0%"),
                tooltip_format: pct,
                halfwidth: true,
                refl: 1,
            });

            $("#ev_history").style.display = "none";
            $("#pv_history").style.display = "none";
        })

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

    fetch("usa.json", {cache: "force-cache"})
        .then(r => r.json())
        .then(us_json => {
            window.us = us_json;
            chart_map(estimates.states, us_json, "#map");
        })

    fetch(prev_url, {cache: "force-cache"})
        .then(r => r.text())
        .then(raw => {
            let parsed = d3.csvParse(raw);
            window.prev_results = d3.nest().key(d => d.state).object(parsed);
        })
    .then(() => {
    fetch(state_hist_url, fetch_opts)
        .then(r => r.text())
        .then(history => {
            window.state_hist = d3.csvParse(history)
                .map(d => {
                    d.date = toDate(d.date);
                    return d;
                });

            let st_sel = d3.select("#state");
            st_sel.selectAll("option")
                .data(estimates.states)
                .enter().append("option")
                .attr("value", d => d.state)
                .text(d => d.state_name);
            st_sel.on("change", state_select);

            let tip_max = d3.max(estimates.states, d => d.tipping_pt);
            let tip_idx = estimates.states.findIndex(d => d.tipping_pt == tip_max);
            st_sel.node().value = estimates.states[tip_idx].state;
            state_select();
        });
    });

    fetch(sims_url, fetch_opts)
        .then(r => r.json())
        .then(sims => {
            sims = d3.shuffle(sims);

            window.sim_ctr = 0;
            $("#sim_elec").onclick = () => sim_election(sims, "#map");
            $("#reset_map").onclick = () => reset_map(estimates.states, "#map");

            setup_filter_sim(sims, key_states, "#state_buttons");
        });

    chart_categories(estimates.states, "#categories");
    chart_histogram(estimates, "#histogram");
    table_states(estimates.states, "#states");
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
        let old_5 = data.ev_q05;
        data.ev_q05 = 538 - data.ev_q95;
        data.ev_q95 = 538 - old_5;
        data.prob = 1 - data.prob - 0.004; // rough tie probability
    }
    let frac = probToText(data.prob);

    $(".banner > .text").innerHTML = `
        <p><b style="color: ${dside ? BLUE : RED};">
        ${dside ? "Joe Biden" : "Donald Trump"}</b> has a
        <b>${frac} chance</b> of winning the presidency.</p>
        <p>He is expected to win 
        <b>between ${Math.round(data.ev_q05)} and ${Math.round(data.ev_q95)}</b> 
        electoral votes.</p>`;

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
    $("#prob_pop").innerHTML = probToText(data.prob_pop);
    $("#prob_tie").innerHTML = probToText(data.prob_tie);
    $("#prob_recount").innerHTML = probToText(data.prob_recount);
    $("#cand_lean").innerHTML = dside ? "Biden" : "Trump";
    $("#n_polls").innerHTML = data.n_polls;
    $("#q2_gdp").innerHTML = d3.format(".1%")(data.gdp_mean) + " &pm; " +
        d3.format(".1%")(data.gdp_moe);
    $("#pres_appr").innerHTML = d3.format(".1%")(data.pres_appr);
    $("#natl_prior").innerHTML = d3.format(".1%")(data.prior_natl_mean) + 
        " &pm; " + d3.format(".1%")(data.prior_natl_moe);
}

function state_select(val) {
    let st_sel = $("#state");
    if (!!val) st_sel.value = val;
    let abbr = st_sel.value;
    let name = st_sel.selectedOptions[0].innerHTML;
    if (name == "District of Columbia") name = "D.C.";
    let data = state_hist.filter(d => d.state == abbr);

    $("#selected_state").innerHTML = name;
    $("#state_ev").innerHTML = data[0].ev;

    let prev = prev_results[abbr][0];
    $("#state_2012").innerHTML = `
        <b style="color: ${+prev.dem_win_2012 ? BLUE : RED}">
        ${+prev.dem_win_2012 ? "Obama" : "Romney"}</b> in 2012 by a 
        <b>${d3.format(".2p")(+prev.margin_2012)}</b> margin`;
    $("#state_2016").innerHTML = `
        <b style="color: ${+prev.dem_win_2016 ? BLUE : RED}">
        ${+prev.dem_win_2016 ? "Clinton" : "Trump"}</b> in 2016 by a 
        <b>${d3.format(".2p")(+prev.margin_2016)}</b> margin`;

    if ("polls" in window) {
        let n_polls = polls.filter(p => p.national == "FALSE" && 
                          estimates.states[+p.state-1].state == abbr &&
                          (+p.date + 14*1000*3600*24) >= Date.now()).length
        switch (n_polls) {
            case 0:
                $("#state_polls").innerHTML = `There have been no polls 
                conducted in ${name} in the last two weeks.`; 
                break;
            case 1:
                $("#state_polls").innerHTML = `There has been one poll 
                conducted in ${name} in the last two weeks.`; 
                break;
            default:
                $("#state_polls").innerHTML = `There have been ${n_polls} polls 
                conducted in ${name} in the last two weeks.`; 
                break;
        }
    }

    $("#split_ev").hidden = !(abbr == "NE" || abbr == "ME");

    $("#state_history").innerHTML = "";
    chart_line(data, "#state_history", "prob", false, {
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

    chart_line(data, "#state_history", "dem", true, {
        title: "Projected vote margin in " + name,
        ymin: 0.15,
        ymax: abbr == "DC" ? 0.99 : 0.75,
        addl_left: 4,
        hrule: 0.5,
        hrule_label: "EVEN",
        h: bigScreen ? 300 : 220,
        pts: polls.filter(p => p.national == "FALSE" && 
                          p.date >= toDate("2020-03-14") &&
                          estimates.states[+p.state-1].state == abbr),
        pts_key: "dem",
        halfwidth: true,
        format: margin_rnd,
        tooltip_format: margin,
    });

    $("#tipping_history").innerHTML = "";
    chart_line(data, "#tipping_history", "tipping_pt", false, {
        ymin: 0,
        ymax: 0.32,
        addl_left: 4,
        h: bigScreen ? 260 : 200,
        title: `Chances ${name} decides the elction`,
        format: d3.format(".0%"),
        tooltip_format: pct,
        halfwidth: true,
        hrule: -1e-6, // weird bugfix
        color: "#666",
        refl: 0,
    });
    chart_line(data, "#tipping_history", "rel_voter_power", false, {
        ymin: 0,
        ymax: 5,
        h: bigScreen ? 260 : 200,
        addl_left: 4,
        hrule: 1,
        hrule_label: "AVERAGE",
        title: `Relative importance of ${name} voters`,
        format: d3.format(".1f"),
        tooltip_format: x => x < 0.005 ? "<0.1" : d3.format(".1f")(x),
        halfwidth: true,
        color: "#666",
        refl: 0,
    });
}


const abbrs = {"AK":"Alaska","AL":"Ala.","AR":"Ark.","AZ":"Ariz.","CA":"Calif.",
    "CO":"Colo.","CT":"Conn.","DC":"D.C.","DE":"Del.","FL":"Fla.","GA":"Ga.",
    "HI":"Hawaii","IA":"Iowa","ID":"Idaho","IL":"Ill.","IN":"Ind.","KS":"Kan.",
    "KY":"Ky.","LA":"La.","MA":"Mass.","MD":"Md.","ME":"Me.","MI":"Mich.",
    "MN":"Minn.","MO":"Mo.","MS":"Miss.","MT":"Mont.","NC":"N.C.","ND":"N.D.",
    "NE":"Neb.","NH":"N.H.","NJ":"N.J.","NM":"N.M.","NV":"Nev.","NY":"N.Y.",
    "OH":"Ohio","OK":"Okla.","OR":"Ore.","PA":"Pa.","RI":"R.I.","SC":"S.C.",
    "SD":"S.D.","TN":"Tenn.","TX":"Tex.","UT":"Utah","VA":"Va.","VT":"Vt.",
    "WA":"Wash.","WI":"Wis.","WV":"W.Va.","WY":"Wyo."};

main();
