const p_url = "https://corymccartan.github.io/president/estimate.json";
const s_url = "https://corymccartan.github.io/senate/estimate.json";
const h_url = "https://corymccartan.github.io/us-house-20/estimate.json";

let fetch_opts = {cache: "reload"};
let toDate = d => new Date(d + "T02:00:00-04:00");

async function main() {
    let pr_p = (await (await fetch(p_url, fetch_opts)).json()).prob;
    let pr_s = (await (await fetch(s_url, fetch_opts)).json()).prob;
    let pr_h = (await (await fetch(h_url, fetch_opts)).json()).prob;

    let data = [];
    for (let i = 7; i >= 0; i--) {
        let pres = (i & 2) > 0; 
        let senate = (i & 1) > 0; 
        let house = (i & 4) > 0; 

        let p1 = pres ? pr_p : 1 - pr_p;
        let p2 = senate ? pr_s : 1 - pr_s;
        let p3 = house ? pr_h : 1 - pr_h;

        let prob_low = Math.max(0, p1+p2+p3-2);
        let prob_high = Math.min(p1, p2, p3);

        if (pres && senate && house) {
            prob_low = p1 * p2 * p3;
        } else if (!pres && !senate && !house) {
            prob_high = p1 * p2 * p3;
        }

        let prob =0.5*prob_low + 0.5*prob_high;
        data.push({pres, senate, house, prob, prob_low, prob_high});
    }
    window.probs = data;

    let prob_color = d3.scaleSqrt()
        .domain([0.0, 1])
        .range(["transparent", "#444c"]);

    let table = d3.select("#probs").select("tbody");
    let rows = table.selectAll("tr.combo")
        .data(data)
        .enter().append("tr")
        .attr("class", "combo");

    let get_bg = function(control, prob) {
        prob = Math.round(256*Math.sqrt(prob)).toString(16);
        return (control ? "#6677ff" : "#ff7766") + prob;
    };

    rows.append("td")
        .style("background", d => get_bg(d.pres, d.prob))
        .text(d => d.pres ? "Biden" : "Trump");

    rows.append("td")
        .style("background", d => get_bg(d.senate, d.prob))
        .text(d => d.senate ? "Dem." : "Rep.");

    rows.append("td")
        .style("background", d => get_bg(d.house, d.prob))
        .text(d => d.house ? "Dem." : "Rep.");

    pct_fmt = d3.format(".0%");
    rows.append("td")
        .style("background", d => prob_color(d.prob))
        .text(d => pct_fmt(d.prob_low) + " – " + pct_fmt(d.prob_high));
}

main();
