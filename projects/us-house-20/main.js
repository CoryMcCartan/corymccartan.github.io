const est_url = "https://corymccartan.github.io/us-house-20/estimate.json";
const hist_url = "https://corymccartan.github.io/us-house-20/history.csv";
const poll_url = "https://corymccartan.github.io/us-house-20/polls.csv";

const currentSeats = 235;

let margin = function(x) {
    let fmt = d3.format(".1f");
    if (x == 0.5) return "0.0";
    return x > 0.5 ? "D+" + fmt(200*x - 100) : "R+" + fmt(100 - 200*x);
};
let margin_rnd = function(x) {
    let fmt = d3.format(".0f");
    if (x == 0.5) return "0";
    return x > 0.5 ? "D+" + fmt(200*x - 100) : "R+" + fmt(100 - 200*x);
};

async function main() {
    let estimates = await (await fetch(est_url)).json();
    estimates.intent = estimates.intent.map(d => {
        d.date = new Date(d.date + " 2:00 EDT");
        return d;
    });
    window.estimates = estimates;

    fill_summary(estimates);
    
    fetch(hist_url)
        .then(r => r.text())
        .then(history => {
            window.hist = d3.csvParse(history)
                .map(d => {
                    d.date = new Date(d.date + " 2:00 EDT");
                    return d;
                });

            chart_line(hist, "#prob_history", "prob", false, {
                ymin: 0.0, ymax: 1,
                hrule: 0.5,
                addl_left: 4,
                hrule_label: "EVEN",
                h: bigScreen ? 280 : 200,
                title: "Chances of controlling the House",
                format: d3.format(".0%"),
                tooltip_format: d3.format(".0%"),
                smooth: true,
                refl: 1,
            });
            chart_line(hist, "#seat_history", "s", true, {
                title: "Projected Democratic seats",
                hrule: 218,
                pad: 0.1,
                smooth: true,
                hrule_label: "MAJORITY",
            });
        })

    fetch(poll_url)
        .then(r => r.text())
        .then(raw => {
            window.polls = d3.csvParse(raw)
            .map(d => {
                d.date = new Date(d.date + " 2:00 EDT");
                return d;
            });

            chart_line(estimates.intent, "#public_opinion", "i", true, {
                title: "Estimated margin in national support",
                addl_left: 4,
                hrule: 0.5,
                hrule_label: "EVEN",
                pts: polls,
                pts_key: "dem",
                dodge: true,
                //ymin: 0.45, ymax: 0.6,
                pad: 0.3,
                xstep: 7,
                format: margin_rnd,
                tooltip_format: margin,
                today: Date.now(),
            });
        });

    chart_histogram(estimates, "#histogram");
    table_firms(estimates.firm_effects, "#firms");

    $("#sim_elec").onclick = function() {
        let seats = sampleHist(estimates.hist) + estimates.s_min;
        let party, color, gl;
        let chg = Math.abs(seats - currentSeats);
        if (seats >= 218) {
            party = "Democrats";
            color = BLUE;
            gl = seats >= currentSeats ? "gain" : "loss";
        } else {
            party = "Republicans";
            color = RED;
            gl = seats >= currentSeats ? "loss" : "gain";
            seats = 435 - seats;
        }

        $("#sim_result").innerHTML = `The <b style="color: ${color}">
            ${party}</b> win a majority with <b>${seats}</b> seats,
            a <b>${gl} of ${chg}</b> ${chg==1 ? "seat" : "seats"}.`;
    }
}

function fill_summary(data) {
    let frac = probToText(data.prob);

    $(".banner > .text").innerHTML = `
        <p>The <b style="color: ${BLUE};">Democrats</b> are expected to win 
        <b>between ${Math.round(data.s_q05)} and ${Math.round(data.s_q95)} 
        seats</b>.</p><p>They have a <b>${frac} chance</b> of keeping control
        of the House.</p>`;

    let date = new Date(data.time);
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
    $("#prob_win2").innerHTML = probToText(data.prob);
    $("#dem_neg").innerHTML = data.prob >= 0.5 ? "" : "not ";
    $("#prob_gain").innerHTML = probToText(data.prob_gain);
    $("#prob_pop").innerHTML = probToText(data.prob_pop);
    $("#n_polls").innerHTML = data.n_polls;
}

function sampleHist(hist) {
    let n = hist.length;
    let u = Math.random() * d3.sum(hist);
    let cuml = 0;
    let x;
    for (x = 0; x < n; x++) {
        cuml += hist[x];
        if (cuml >= u) break;
    }
    return x;
}

main();
