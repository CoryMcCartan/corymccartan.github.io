let pct = function(x) {
    if (x < 0.005)
        return "<1%";
    else if (x > 0.995)
        return ">99%";
    else
        return d3.format(".0%")(x);
};

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

function chart_categories(data, id) {
    let container = d3.select(id);
    const h = bigScreen ? 360 : 300;
    const w = container.node().getBoundingClientRect().width;
    let lbl_size = 10 + w*0.012;
    let gap = 8 + lbl_size*1.25;

    let svg = container.append("svg")
        .attr("width", w)
        .attr("height", h);

    let by_rating = d3.nest().key(d => d.rating)
        .sortValues((a, b) => a.prob >= 0.65 ? b.prob - a.prob : a.prob - b.prob)
        .entries(data);
    let totals = by_rating.map(d => d3.sum(d.values, x => x.ev));
    let max_total = d3.max(totals);
    by_rating.map((d, i) => {
        let cuml = 0;
        //let max = d3.max(d.values, x => x.ev);
        for (let s of d.values) {
            //s.mult = Math.pow(max / s.ev, 0.4 + 0.25*(1 - maxes[i]/55));
            s.mult = Math.pow(55 / s.ev, w / (11*h) + 0.2);
            s.h = s.ev * s.mult;
            cuml += s.h;
            s.cuml_h = cuml;
            s.rand = Math.random();
        }
    });
    let h_totals = by_rating.map((d, i) => ({
        rating: +d.key,
        h: d.values.slice(-1)[0].cuml_h,
        ev_total: totals[i],
        rand: d.values.slice(-1)[0].rand,
        n_state: d.values.length,
    }));
    let max_h = d3.max(h_totals, x => x.h);

    let bracket_h = d3.max(h_totals.filter(x => Math.abs(x.rating) <= 1), x => x.h);
    let n_comp = d3.sum(h_totals.filter(x => Math.abs(x.rating) <= 1), 
                        x => x.n_state);
    let ev_comp = d3.sum(h_totals.filter(x => Math.abs(x.rating) <= 1), 
                        x => x.ev_total);

    let labels = bigScreen ? ["Safe Dem.", "Likely Dem.", "Lean Dem.", 
        "Tossup", "Lean Rep.", "Likely Rep.", "Safe Rep."]
        : ["Safe D", "Likely D", "Lean D", "Tossup", 
                "Lean R", "Likely R", "Safe R"];

    let x = d3.scaleBand()
        .domain([-3, -2, -1, 0, 1, 2, 3])
        .range([0, w])
        .padding(bigScreen ? 0.08 : 0.03)
        .paddingOuter(0);
    let y = d3.scaleLinear()
        .domain([0, max_h])
        .range([h+0.5, gap]);

    let midpt = "#fafffa";
    let color_dem = d3.scaleLinear()
        .domain([0, -3])
        .range([midpt, BLUE]);
    let color_gop = d3.scaleLinear()
        .domain([3, 0])
        .range([RED, midpt]);
    let color = x => x > 0 ? color_gop(x) : color_dem(x);

    let axis = d3.axisBottom(x)
        .tickSize(8)
        .tickSizeOuter(0)
        .tickFormat(x => labels[x+3]);

    svg.append("g")
        .attr("transform", `translate(0, ${h})`)
        .call(axis)
        .attr("opacity", 0.7)
        .selectAll("text")
        .attr("font-size", bigScreen ? 13 : 11);

    let states = svg.append("g");
    let state_rects = states.selectAll("rect")
        .data(data)
        .enter().append("rect")
        .attr("x", d => x(d.rating) + (w*0.015)*d.rand
              + x.bandwidth()*(1 - 1/d.mult)/2)
        .attr("y", d => y(d.cuml_h))
        .attr("height", d => y(0) - y(d.h))
        .attr("width", d => x.bandwidth() / d.mult)
        .attr("fill", d => color(d.rating))
        .attr("stroke", BLK);

    let fontSize = bigScreen ? d => 2 + (w/h)*0.25*(y(0) - y(d.h))
        : d => 6 + (w/h)*0.2*(y(0) - y(d.h));
    states.selectAll("text")
        .data(data)
        .enter().append("text")
        .attr("x", d => x(d.rating) + (w*0.015)*d.rand + x.bandwidth()/2)
        .attr("y", d => y(d.cuml_h - d.ev*d.mult/2) + 0.08*(y(0) - y(d.h)))
        .attr("font-size", fontSize)
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .attr("fill", "#0006")
        .text(d => fontSize(d) < 8 ? "" : d.state);

    // top of bar labels
    svg.append("g")
        .selectAll("text")
        .data(h_totals)
        .enter().append("text")
        .attr("x", d => x(d.rating) + (w*0.015)*d.rand + x.bandwidth()/2)
        .attr("y", d => y(d.h) - 4)
        .attr("text-anchor", "middle")
        .attr("font-size", lbl_size)
        .attr("fill", "#666")
        .style("font-weight", "bold")
        .text(d => d.ev_total + (Math.abs(d.rating) == 3 ? " EVs" : ""))


    // brace and label
    svg.append("line")
        .attr("x1", x(-1))
        .attr("x2", x(1) + x.bandwidth())
        .attr("y1", y(bracket_h) - lbl_size - 16)
        .attr("y2", y(bracket_h) - lbl_size - 16)
        .attr("stroke", BLK)
        .attr("stroke-linecap", "square")
        .attr("stroke-width", 3);
    svg.append("line")
        .attr("x1", x(-1))
        .attr("x2", x(-1))
        .attr("y1", y(bracket_h) - lbl_size - 16)
        .attr("y2", y(bracket_h) - lbl_size - 8)
        .attr("stroke", BLK)
        .attr("stroke-linecap", "square")
        .attr("stroke-width", 3);
    svg.append("line")
        .attr("x1", x(1) + x.bandwidth())
        .attr("x2", x(1) + x.bandwidth())
        .attr("y1", y(bracket_h) - lbl_size - 16)
        .attr("y2", y(bracket_h) - lbl_size - 8)
        .attr("stroke", BLK)
        .attr("stroke-linecap", "square")
        .attr("stroke-width", 3);

    svg.append("text")
        .attr("x", d => x(0) + x.bandwidth()/2)
        .attr("y", d => y(bracket_h) - 2*lbl_size - 22)
        .attr("text-anchor", "middle")
        .attr("font-size", 4 + lbl_size*0.6)
        .attr("fill", "#666")
        .text(n_comp + " competitive states");
    svg.append("text")
        .attr("x", d => x(0) + x.bandwidth()/2)
        .attr("y", d => y(bracket_h) - lbl_size - 24)
        .attr("text-anchor", "middle")
        .attr("font-size", 4 + lbl_size*0.6)
        .attr("fill", "#666")
        .text(`with ${ev_comp} electoral votes`);


    let tt = container.append("div")
        .attr("class", "tooltip")
        .style("visibility", "hidden");

    state_rects.on("mousemove", function(d) {
        let [mx, my] = d3.mouse(svg.node());
        if (mx < 40) mx = 40;
        if (mx > w - 120) mx = w - 120;

        let candidate = d.prob > 0.5 ? "Biden" : "Trump";
        let color = d.prob > 0.5 ? DARK_BLUE : DARK_RED;
        let cand_prob = probToText(d.prob > 0.5 ? d.prob : 1 - d.prob);

        d3.select(this).attr("stroke-width", 3);

        let txt = `<h3>${d.state_name}</h3>
        ${d.ev} electoral votes
        <div style="width: 100%; height: 1.5em; margin: 4px 0; display: flex;">
        <div style="background: ${BLUE}; flex-basis: ${100*d.prob}%"></div>
        <div style="background: ${RED}; flex-basis: ${100 - 100*d.prob}%"></div>
        </div>
        <b style="color: ${color};">${candidate}</b> has a <b>${cand_prob}</b>
        chance of winning.
        `;

        tt.style("visibility", "visible")
            .html(txt)
            .style("left", (mx - 50) + "px")
            .style("bottom", (h - my + 15) + "px");
    });
    svg.on("mouseout", function() {
        tt.style("visibility", "hidden");
        state_rects.attr("stroke-width", 1);
    });

    state_rects.on("click", function(d) {
        state_select(d.state);
        svg.dispatch("mouseout");
        $("#state").scrollIntoView();
        window.scrollBy(0, -56);
    });
}

function chart_map(data, us, id) {
    let container = d3.select(id);
    const w = container.node().getBoundingClientRect().width;
    const h = w * 0.625;

    let ids = us.objects.states.geometries.map(d => d.id);
    window.idxs = {};
    for (id of ids) {
        idxs[id] = data.findIndex(d => d.state_name == id);
    }

    let chart = container.append("svg")
        .attr("width", w)
        .attr("height", h);

    let projection = d3.geoAlbersUsa()
        .scale(1.35 * w)
        .translate([1.02*w/2, 0.98*h/2]);
    let path = d3.geoPath().projection(projection);

    let midpt = "#fafffa";
    let color_dem = d3.scaleLinear()
        .domain([0.5, 1.0])
        //.domain([-0.3, -3])
        .range([midpt, BLUE]);
    let color_gop = d3.scaleLinear()
        .domain([0.0, 0.5])
        //.domain([3, 0.3])
        .range([RED, midpt]);
    window.color = x => x <= 0.5 ? color_gop(x) : color_dem(x);
    //let color = x => x > 0 ? color_gop(x) : color_dem(x);

    let st_feat = topojson.feature(us, us.objects.states).features;
    let states = chart.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(st_feat)
        .enter().append("path")
        .attr("fill", d => color(data[idxs[d.id]].prob))
        .attr("d", path)
        .style("stroke", "#222")
        .style("stroke-width", "1px");

    let states_hover = chart.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(st_feat)
        .enter().append("path")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", "0");

    let tt = container.append("div")
        .attr("class", "tooltip")
        .style("visibility", "hidden");

    let mmv = function(d) {
        let [mx, my] = d3.mouse(chart.node());
        if (mx < 40) mx = 40;
        if (mx > w - 120) mx = w - 120;

        let state = d.id;
        let prob = data[idxs[state]].prob;
        let candidate = prob > 0.5 ? "Biden" : "Trump";
        let color = prob > 0.5 ? DARK_BLUE : DARK_RED;
        let cand_prob = probToText(prob > 0.5 ? prob : 1 - prob);

        d3.select(this).style("stroke-width", "3px");

        let txt = `<h3>${state}</h3>
        ${data[idxs[state]].ev} electoral votes
        <div style="width: 100%; height: 1.5em; margin: 4px 0; display: flex;">
        <div style="background: ${BLUE}; flex-basis: ${100*prob}%"></div>
        <div style="background: ${RED}; flex-basis: ${100 - 100*prob}%"></div>
        </div>
        <b style="color: ${color};">${candidate}</b> has a <b>${cand_prob}</b>
        chance of winning.
        `;

        tt.style("visibility", "visible")
            .html(txt)
            .style("left", (mx - 50) + "px")
            .style("bottom", (h - my + 25) + "px");
    };
    let mout = function() {
        tt.style("visibility", "hidden");
        states_hover.style("stroke-width", "0");
    };

    states_hover.on("mousemove", mmv);
    states_hover.on("touchmove", mmv);
    chart.on("mouseout", mout);
    chart.on("touchend", mout);

    states_hover.on("click", function(d) {
        state_select(data[idxs[d.id]].state);
        chart.dispatch("mouseout");
        $("#state").scrollIntoView();
        window.scrollBy(0, -56);
    });
}

function chart_histogram(data, id) {
    let container = d3.select(id);
    const h = bigScreen ? 280 : 200;
    const w = container.node().getBoundingClientRect().width;
    const gap = 70;
    const min = 269 - Math.max(Math.abs(269 - data.ev_min), 
                               Math.abs(269 - data.ev_max)) 
               + (bigScreen ? 20 : 30);
    const max = 269 + (269 - min);
    const total = d3.sum(data.hist);

    let svg = container.append("svg")
        .attr("width", w)
        .attr("height", h);

    let evs = data.hist.map((c, i) => [i, c])
        .filter(x => x[0] >= min && x[0] <= max);
    let x = d3.scaleLinear()
        .domain([max, min])
        .range([0, w]);
    let x_rev = d3.scaleLinear()
        .domain([538-max, 538-min])
        .range([0, w]);
    let y = d3.scaleLinear()
        .domain([0, d3.max(data.hist)])
        .range([h, gap]);
    let axis = d3.axisBottom(x)
        .ticks(bigScreen ? 8 : 5)
        .tickSize(8)
        .tickSizeOuter(0);
    let gopAxis = d3.axisBottom(x_rev)
        .tickValues(axis.scale().ticks(bigScreen ? 8 : 5).map(x => 538 - x))
        .tickSize(0);

    let rects = svg.append("g")
        .classed("hist", true)
        .selectAll("rect")
        .data(evs)
        .enter().append("rect")
        .attr("x", -0.3)
        .attr("fill", d => d[0] >= 270 ? BLUE : (d[0] == 269 ? "#eeeebb" : RED))
        .attr("transform", d => `translate(${x(d[0])}, ${y(d[1])})`)
        .attr("width", d => x(d[0]-1) - x(d[0]) + 0.3)
        .attr("height", d => h - y(d[1]));
    svg.append("g")
        .attr("transform", `translate(0, ${h})`)
        .call(axis)
        .attr("opacity", 0.7)
        .selectAll("text")
        .style("font-weight", "normal")
        .attr("fill", DARK_BLUE);
    svg.append("g")
        .attr("transform", `translate(0, ${h+18})`)
        .call(gopAxis)
        .call(g => g.select(".domain").remove())
        .attr("opacity", 0.7)
        .selectAll("text")
        .style("font-weight", "normal")
        .attr("fill", DARK_RED);

    svg.append("text")
        .attr("x", w + 8)
        .attr("y", h + 10)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "hanging")
        .style("text-shadow", "3px 0 #f4f4f4, -3px 0 #f4f4f4, 0 2px #f4f4f4, 0 -2px #f4f4f4")
        .classed("label", true)
        .style("fill", DARK_BLUE)
        .text("BIDEN EVs");
    svg.append("text")
        .attr("x", w + 8)
        .attr("y", h + 20)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "hanging")
        .style("text-shadow", "3px 0 #f4f4f4, -3px 0 #f4f4f4, 0 2px #f4f4f4, 0 -2px #f4f4f4")
        .classed("label", true)
        .style("fill", DARK_RED)
        .text("TRUMP EVs");

    // WINNER LABEL
    lbl_maj = svg.append("g")
        .attr("transform", d => `translate(${x(269)}, 0)`);
    lbl_maj.append("line")
        //.attr("y1", gap - 8)
        .attr("y1", y(evs[270][1]))
        .attr("y2", h)
        .attr("stroke", BLK)
        .attr("stroke-width", 1);
    if (bigScreen) {
        lbl_maj.append("text")
            .attr("font-size", "8pt")
            .attr("font-weight", "bold")
            .attr("opacity", 0.7)
            .attr("text-anchor", "end")
            .attr("y", h - 3)
            .attr("x", -3)
            .text("← BIDEN WINS");
        lbl_maj.append("text")
            .attr("font-size", "8pt")
            .attr("font-weight", "bold")
            .attr("opacity", 0.7)
            .attr("y", h - 3)
            .attr("x", 3)
            .text("TRUMP WINS →");
    }
        
    // AVG EVs LABEL
    let ev_exp = data.ev_exp >= 270 ? data.ev_exp : 538 - data.ev_exp;
    lbl_avg = svg.append("g")
        .attr("transform", d => `translate(${x(data.ev_exp+0.5)}, 0)`);
    lbl_avg.append("line")
        .attr("y1", gap - 12)
        .attr("y2", h)
        .attr("stroke", BLK)
        .attr("stroke-width", 1);
    lbl_avg.append("text")
        .classed("label", true)
        .attr("text-anchor", "middle")
        .attr("y", gap - 14)
        .text("EXPECTED");

    // CI line
    svg.append("line")
        .attr("x1", x(data.ev_q05))
        .attr("x2", x(data.ev_q95))
        .attr("y1", h+2.5)
        .attr("y2", h+2.5)
        .attr("stroke", BLK)
        .attr("stroke-width", 4);

    
    // TOOLTIPS
    let tt_gop = container.append("div")
        .attr("class", "tooltip")
        .style("text-align", "right")
        .style("right", 0)
        .style("top", bigScreen ? "1em" : "0.5em")
        .style("visibility", "hidden");
    let tt_dem = container.append("div")
        .attr("class", "tooltip")
        .style("text-align", "left")
        .style("left", 0)
        .style("top", bigScreen ? "1em" : "0.5em")
        .style("visibility", "hidden");
    let triangle = svg.append("text")
        .attr("fill", "#777")
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .text("▼")
        .style("visibility", "hidden");

    let bisector = d3.bisector(d => d.date).left;
    let fmt = probToText;
    let mmv = function() {
        let [mx, my] = d3.mouse(svg.node());
        if (mx > w) mx = w;
        if (mx < 0) mx = 0;

        let evs = Math.round(x.invert(mx));

        let pct = d3.sum(data.hist.slice(evs)) / total; 
        if (evs > data.ev_max) pct = 0;
        if (evs < data.ev_min) pct = 1;
        ev_name = bigScreen ? "electoral votes" : "EVs";

        let txt_gop = (`<span style="color: ${RED}; font-weight: bold;">`
                   + `Donald Trump</span> has a <b>${fmt(1-pct)} chance</b> `
                   + `of winning at least <b>${538 - evs} ${ev_name}</b>.`);
        let txt_dem = (`<span style="color: ${BLUE}; font-weight: bold;">`
                   + `Joe Biden</span> has a <b>${fmt(pct)} chance</b> `
                   + `of winning at least <b>${evs} ${ev_name}</b>.`);
        tt_gop.style("visibility", "visible").html(txt_gop);
        tt_dem.style("visibility", "visible").html(txt_dem);

        let tri_value = data.hist[evs];
        if (evs > data.ev_max || evs < data.ev_min) tri_value = 0;
        triangle.style("visibility", "visible")
            .attr("x", x(evs - 0.5))
            .attr("y", y(tri_value) - 3);

        rects.attr("fill", d => d[0] >= 270 ? BLUE : (d[0] == 269 ? "#eeee80" : RED))
            .filter(d => d[0] == evs)
            .attr("fill", d => d[0] >= 270 ? DARK_BLUE : 
                    (d[0] == 269 ? "#dddd70" : DARK_RED));
    };
    let mstop = function() {
        tt_gop.style("visibility", "hidden");
        tt_dem.style("visibility", "hidden");
        triangle.style("visibility", "hidden");
        rects.attr("fill", d => d[0] >= 270 ? BLUE : (d[0] == 269 ? "#eeee80" : RED));
    }

    svg.on("mousemove", mmv);
    svg.on("touchmove", mmv);
    svg.on("mouseout", mstop);
    svg.on("touchend", mstop);
}

function sim_election(sims, id) {
    let sim = sims[window.sim_ctr++];
    if (window.sim_ctr == sims.length) window.sim_ctr = 0;

    let map = d3.select(id).select("svg");
    
    map.selectAll(".states path")
        .attr("fill", d => color(sim.dem[idxs[d.id]]));

    let dside = sim.ev >= 270;
    let cand = dside ? "Joe Biden" : "Donald Trump";
    let pop = dside ? sim.natl : 1 - sim.natl;
    let ev = dside ? sim.ev : 538 - sim.ev;

    if (ev == 269) {
        $("#map_sim_result").innerHTML = `
            <b>Electoral college tie</b>;
            ${sim.natl > 0.5 ? "Joe Biden" : "Donald Trump"}
            wins ${d3.format(".1%")(sim.natl > 0.5 ? sim_natl : 1 - sim_natl)}
            of the popular vote.`;
    }

    $("#map_sim_result").innerHTML = `
        <b style="color: ${dside ? BLUE : RED};">
        ${cand}</b> wins with <b>${ev}</b> electoral votes and 
        <b>${d3.format(".1%")(pop)}</b> of the popular vote.`;

    $("#reset_map").disabled = false;
}

function reset_map(data, id) {
    let map = d3.select(id).select("svg");
    map.selectAll(".states path")
        .attr("fill", d => color(data[idxs[d.id]].prob));

    $("#reset_map").disabled = true;
    $("#map_sim_result").innerHTML = "";
}

function table_states(data, id) {
    let table = d3.select(id).select("tbody");

    data.map(d => {
        d.margin = 200*d.dem_exp - 100;
    });

    let x_dem = d3.scaleLinear()
        .domain([1, 0.5])
        .range([0, 100])
        .clamp(true);
    let x_gop = d3.scaleLinear()
        .domain([0.5, 0])
        .range([0, 100])
        .clamp(true);

    let midpt = "transparent";
    let color_dem = d3.scaleLinear()
        .domain([0.5, 1.0])
        .range([midpt, BLUE+"b"]);
    let color_gop = d3.scaleLinear()
        .domain([0.0, 0.5])
        .range([RED+"c", midpt]);
    let prob_color = x => x <= 0.5 ? color_gop(x) : color_dem(x);
    let tip_color = d3.scaleLinear()
        .domain([0.0, d3.max(data, d => d.tipping_pt)])
        .range([midpt, "#666a"]);
    let power_color = d3.scaleLinear()
        .domain([1.0, d3.max(data, d => d.rel_voter_power)])
        .range([midpt, "#666a"]);

    let rows = table.selectAll("tr.state")
        .data(data)
        .enter().append("tr")
        .attr("class", "state");

    rows.append("td")
        .text(d => bigScreen ? d.state_name : abbrs[d.state])
        .on("click", d => {
            state_select(d.state)
            $("#state").scrollIntoView();
            window.scrollBy(0, -56);
        });

    rows.append("td")
        .text(d => pct(d.prob))
        .attr("class", "num")
        .style("background", d => prob_color(d.prob));

    let ici_d = BLUE + "b";
    let oci_d = BLUE + "7";
    let ici_r = RED + "c";
    let oci_r = RED + "8";
    rows.append("td")
        .attr("class", "est")
        .append("div")
        .style("background", d => `linear-gradient(90deg, transparent 0%,
               transparent ${x_dem(d.dem_q95)}%, ${oci_d} ${x_dem(d.dem_q95)}%, 
               ${oci_d} ${x_dem(d.dem_q75)}%, ${ici_d} ${x_dem(d.dem_q75)}%,
               ${ici_d} ${x_dem(d.dem_q25)}%, ${oci_d} ${x_dem(d.dem_q25)}%,
               ${oci_d} ${x_dem(d.dem_q05)}%, transparent ${x_dem(d.dem_q05)}%,
               transparent 100%`)
        .html(d => d.dem_exp >= 0.5 ? "&bull;" : "")
        .style("padding-left", d => d.dem_exp >= 0.5 ? 
               x_dem.clamp(false)(d.dem_exp) + "%" :  "");
    rows.append("td")
        .attr("class", "est")
        .append("div")
        .style("background", d => `linear-gradient(90deg, transparent 0%,
               transparent ${x_gop(d.dem_q95)}%, ${oci_r} ${x_gop(d.dem_q95)}%, 
               ${oci_r} ${x_gop(d.dem_q75)}%, ${ici_r} ${x_gop(d.dem_q75)}%,
               ${ici_r} ${x_gop(d.dem_q25)}%, ${oci_r} ${x_gop(d.dem_q25)}%,
               ${oci_r} ${x_gop(d.dem_q05)}%, transparent ${x_gop(d.dem_q05)}%,
               transparent 100%`)
        .html(d => d.dem_exp < 0.5 ? "&bull;" : "")
        .style("padding-left", d => d.dem_exp < 0.5 ? 
               x_gop.clamp(false)(d.dem_exp) + "%" :  "");

    let margin = function(x) {
        let fmt = bigScreen ? d3.format(".1f") : d3.format(".0f");
        return(x > 0 ? "<b>D</b>+" + fmt(Math.abs(x)) :
               "<b>R</b>+" + fmt(Math.abs(x)));
    };
    rows.append("td")
        .attr("class", "num")
        .html(d => margin(d.margin))
        .style("color", d => d.prob > 0.5 ? BLUE : RED);

    rows.append("td")
        .text(d => pct(d.tipping_pt))
        .attr("class", "num")
        .style("background", d => tip_color(d.tipping_pt));
    rows.append("td")
        .text(d => d.rel_voter_power < 0.005 ? "<0.1" : 
              d3.format(".1f")(d.rel_voter_power))
        .attr("class", "num")
        .style("background", d => power_color(d.rel_voter_power));

    let sort_fun = (a, b) => d3.ascending(Math.abs(a.margin), Math.abs(b.margin));
    rows.sort(sort_fun);

    let more_state = true;
    let button = $("#show");
    button.onclick = function() {
        more_state = !more_state;
        button.innerHTML = more_state ? "Show more states" : "Show fewer states";
        d3.select("#states").classed("minim", more_state);
        if (more_state) {
            $("#states").scrollIntoView();
            window.scrollBy(0, -56);
        }
    };
    
    
    let headers = d3.select(id).selectAll("th");
    headers.on("click", function() {
        if (this.dataset.sort == 1)
            this.dataset.asc = 1 - this.dataset.asc;
        headers.attr("data-sort", 0);
        this.dataset.sort = 1;

        let order = this.dataset.asc == 1? d3.ascending : d3.descending;
        let ext_fun;
        switch (this.dataset.kind) {
            case "state":
                ext_fun = d => d.state_name;
                break;
            case "prob":
                ext_fun = d => d.prob;
                break;
            case "vote":
                ext_fun = d => d.dem_exp;
                break;
            case "margin":
                ext_fun = d => Math.abs(d.margin);
                break;
            case "tipping":
                ext_fun = d => d.tipping_pt;
                break;
            case "power":
                ext_fun = d => d.rel_voter_power;
                break;
        }

        headers.classed("selected", false);
        d3.select(this).classed("selected", true);

        sort_fun = (a, b) => order(ext_fun(a), ext_fun(b));
        rows.sort(sort_fun);
    });
}

function setup_filter_sim(sims, key_states, id) {
    let states = key_states.slice(0, 15).map(d => {
        d.winner = -1;
        d.sim_prob = d.prob;
        d.idx = idxs[d.state_name];
        return d;
    });
    window.st = states;

    let buttons = d3.select(id)
        .selectAll("div.button")
        .data(states)
        .enter().append("div")
        .attr("class", "button")
        .text(d => d.state);

    let updateSim = function() {
        let filtered = sims.filter(sim => {
            for (s of states) {
                if (s.winner >= 0 && sim.dem[s.idx] != s.winner)
                    return false;
            }
            return true;
        });

        let selected = 0;
        states.map(s => {
            if (s.winner >= 0) {
                s.sim_prob = s.winner
                selected++;
            } else {
                s.sim_prob = d3.mean(filtered.map(sim => sim.dem[s.idx]));
            }
        });

        buttons
            .classed("selected", d => d.winner >= 0)
            .style("background", d => `linear-gradient(90deg, ${BLUE}
                   ${100*d.sim_prob}%, ${RED} ${100*d.sim_prob}%)`);

        if (filtered.length < 40) {
            $("#filter_warning").innerHTML = `<b style="color: #666">
                Not enough simulations to estimate accurately.</b><br />
                Please un-select a few states.`;
            $("#filter_sum").innerHTML = "";
            $("#filter_prob").style.background = "";
            $("#scenario_prob").innerHTML = "";
            return;
        }

        $("#filter_warning").innerHTML = "";
        if (selected == 0) {
            $("#filter_sum").innerHTML = "";
            $("#filter_prob").style.background = "";
            $("#scenario_prob").innerHTML = "";
            return;
        }

        let pv_avg = d3.median(filtered.map(sim => sim.natl));
        let prob = d3.mean(filtered.map(sim => +(sim.ev >= 270)));
        let dside = prob > 0.5;
        let cand = dside ? "Biden" : "Trump";
        pv_avg = dside ? pv_avg : 1 - pv_avg;

        $("#filter_sum").innerHTML = `
        <b style="color: ${dside ? BLUE : RED};">${cand}</b> 
        would have a <b>${probToText(dside ? prob : 1 - prob)}</b>
        chance of winning and be expected to earn 
        <b>${d3.format(".1%")(pv_avg)}</b> of the popular vote.`;

        $("#filter_prob").style.background = `linear-gradient(90deg, ${BLUE}
            ${100*prob}%, ${RED} ${100*prob}%)`;

        $("#scenario_prob").innerHTML = `This particular outcome has a 
        ${d3.format(".2p")(filtered.length / sims.length)} chance of occuring.`;
    };
    updateSim();

    let toggleState = function(d) {
        if (d.winner == -1) 
            d.winner = Math.round(d.prob);
        else if (d.winner == Math.round(d.prob))
            d.winner = 1 - d.winner;
        else
            d.winner = -1;
        updateSim();
    };

    let resetAll = function() {
        states.map(s => { s.winner = -1; });
        updateSim();
    };
    
    buttons.on("click", toggleState);
    $("#reset_states").onclick = resetAll;
}


function rectCollide() {
    var nodes, sizes, masses
    var size = () => [0, 0];
    var strength = 1
    var iterations = 1

    function force() {
        var node, size, mass, xi, yi
        var i = -1
        while (++i < iterations) { iterate() }

        function iterate() {
            var j = -1
            var tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare)

            while (++j < nodes.length) {
                node = nodes[j]
                size = sizes[j]
                mass = masses[j]
                xi = xCenter(node)
                yi = yCenter(node)

                tree.visit(apply)
            }
        }

        function apply(quad, x0, y0, x1, y1) {
            var data = quad.data
            var xSize = (size[0] + quad.size[0]) / 2
            var ySize = (size[1] + quad.size[1]) / 2
            if (data) {
                if (data.index <= node.index) { return }

                var x = xi - xCenter(data)
                var y = yi - yCenter(data)
                var xd = Math.abs(x) - xSize
                var yd = Math.abs(y) - ySize

                if (xd < 0 && yd < 0) {
                    var l = Math.sqrt(x * x + y * y)
                    var m = masses[data.index] / (mass + masses[data.index])

                    if (Math.abs(xd) < Math.abs(yd)) {
                        node.vx -= (x *= xd / l * strength) * m
                        data.vx += x * (1 - m)
                    } else {
                        node.vy -= (y *= yd / l * strength) * m
                        data.vy += y * (1 - m)
                    }
                }
            }

            return x0 > xi + xSize || y0 > yi + ySize ||
                   x1 < xi - xSize || y1 < yi - ySize
        }

        function prepare(quad) {
            if (quad.data) {
                quad.size = sizes[quad.data.index]
            } else {
                quad.size = [0, 0]
                var i = -1
                while (++i < 4) {
                    if (quad[i] && quad[i].size) {
                        quad.size[0] = Math.max(quad.size[0], quad[i].size[0])
                        quad.size[1] = Math.max(quad.size[1], quad[i].size[1])
                    }
                }
            }
        }
    }

    function xCenter(d) { return d.x + d.vx + sizes[d.index][0] / 2 }
    function yCenter(d) { return d.y + d.vy + sizes[d.index][1] / 2 }

    force.initialize = function (_) {
        sizes = (nodes = _).map(size)
        masses = sizes.map(function (d) { return d[0] * d[1] })
    }

    force.size = function (_) {
        return (arguments.length
             ? (size = typeof _ === 'function' ? _ : () => _, force)
             : size)
    }

    force.strength = function (_) {
        return (arguments.length ? (strength = +_, force) : strength)
    }

    force.iterations = function (_) {
        return (arguments.length ? (iterations = +_, force) : iterations)
    }

    return force;
}
