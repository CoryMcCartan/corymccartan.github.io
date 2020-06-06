let pct = function(x) {
    if (x <= 0.005)
        return "<1%";
    else if (x >= 0.995)
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

function chart_histogram(data, id) {
    let container = d3.select(id);
    const h = bigScreen ? 280 : 200;
    const w = container.node().getBoundingClientRect().width;
    const gap = 70;
    const min = data.s_min;
    const max = data.s_max;
    const total = d3.sum(data.hist);

    let svg = container.append("svg")
        .attr("width", w)
        .attr("height", h);


    let seats = data.hist.map((c, i) => [30 + i, c])
        .filter(x => x[0] >= min && x[0] <= max);
    let x = d3.scaleLinear()
        .domain([max, min])
        .range([0, w]);
    let x_rev = d3.scaleLinear()
        .domain([100-max, 100-min])
        .range([0, w]);
    let y = d3.scaleLinear()
        .domain([0, d3.max(data.hist)])
        .range([h, gap]);
    let axis = d3.axisBottom(x)
        .ticks(bigScreen ? max - min : 10)
        .tickSize(8)
        .tickSizeOuter(0);
    let gopAxis = d3.axisBottom(x_rev)
        .tickValues(axis.scale().ticks(bigScreen ? max - min : 10).map(x => 100 - x))
        .tickSize(0);

    const spacing = bigScreen ? 4 : 2;
    const offset = 0.5 * Math.abs(x(50) - x(49));
    let rects = svg.append("g")
        .classed("hist", true)
        .selectAll("rect")
        .data(seats)
        .enter().append("rect")
        .attr("x", spacing)
        .attr("fill", d => d[0] >= 51 ? BLUE : RED)
        .attr("transform", d => `translate(${x(d[0]) - offset}, ${y(d[1])})`)
        .attr("width", d => x(d[0]-1) - x(d[0]) - 2*spacing)
        .attr("height", d => h - y(d[1]));
    svg.append("g")
        .attr("transform", `translate(0, ${h})`)
        .call(axis)
        .attr("opacity", 0.7)
        .selectAll("text")
        .style("font-weight", "bold")
        .style("font-size", "12px")
        .attr("fill", DARK_BLUE);
    svg.append("g")
        .attr("transform", `translate(0, ${h+20})`)
        .call(gopAxis)
        .call(g => g.select(".domain").remove())
        .attr("opacity", 0.7)
        .selectAll("text")
        .style("font-weight", "bold")
        .style("font-size", "12px")
        .attr("fill", DARK_RED);

    svg.append("rect")
        .attr("x", spacing)
        .attr("fill", BLUE)
        .attr("transform", `translate(${x(50) - offset}, ${y(seats[50-min][1])})`)
        .attr("width", (x(49) - x(50) - 2*spacing) * data.pr_presidency)
        .attr("height", h - y(seats[50-min][1]));

    svg.append("text")
        .attr("x", w + 8)
        .attr("y", h - 4)
        .attr("text-anchor", "end")
        //.attr("alignment-baseline", "hanging")
        //.style("text-shadow", "3px 0 #f4f4f4, -3px 0 #f4f4f4, 0 2px #f4f4f4, 0 -2px #f4f4f4")
        .classed("label", true)
        .style("fill", "#444")
        .text("SEATS");

    // WINNER LABEL
    lbl_maj = svg.append("g")
        .attr("transform", d => `translate(${x(269)}, 0)`);
    lbl_maj.append("line")
        //.attr("y1", gap - 8)
        .attr("y1", y(seats[50 - min][1]))
        .attr("y2", h)
        .attr("stroke", BLK)
        .attr("stroke-width", 1);
        
    // AVG EVs LABEL
    let s_exp = data.s_exp >= 50 ? data.s_exp : 100 - data.s_exp;
    lbl_avg = svg.append("g")
        .attr("transform", d => `translate(${x(data.s_exp)}, 0)`);
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
        
    // CURRENT SEATS LABEL
    cur_seats = 47;
    lbl_cur = svg.append("g")
        .attr("transform", d => `translate(${x(cur_seats)}, 0)`);
    lbl_cur.append("line")
        .attr("y1", gap + 13)
        .attr("y2", h)
        .attr("stroke", BLK)
        .attr("stroke-width", 1);
    lbl_cur.append("rect")
        .attr("x", -30)
        .attr("width", 60)
        .attr("y", gap)
        .attr("height", 13)
        .attr("fill", "#f4f4f4");
    lbl_cur.append("text")
        .classed("label", true)
        .attr("text-anchor", "middle")
        .attr("y", gap + 11)
        .text(`${cur_seats}–${100-cur_seats} NOW`);

    // CI line
    svg.append("line")
        .attr("x1", x(data.s_q05) + offset - spacing)
        .attr("x2", x(data.s_q95) - offset + spacing)
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

        let seats = Math.round(x.invert(mx));

        let pct = d3.sum(data.hist.slice(seats - 30)) / total; 
        if (seats > data.s_max) pct = 0;
        if (seats < data.s_min) pct = 1;

        let txt_gop = (`The <span style="color: ${RED}; font-weight: bold;">`
                   + `Republicans</span> have a <b>${fmt(1-pct)} chance</b> `
                   + `of winning at least <b>${100 - seats} seats</b>.`);
        let txt_dem = (`The <span style="color: ${BLUE}; font-weight: bold;">`
                   + `Democrats</span> have a <b>${fmt(pct)} chance</b> `
                   + `of winning at least <b>${seats} seats</b>.`);
        tt_gop.style("visibility", "visible").html(txt_gop);
        tt_dem.style("visibility", "visible").html(txt_dem);

        let tri_value = data.hist[seats - 30];
        if (seats > data.s_max || seats < data.s_min) tri_value = 0;
        triangle.style("visibility", "visible")
            .attr("x", x(seats))
            .attr("y", y(tri_value) - 3);

        rects.attr("fill", d => d[0] >= 51 ? BLUE : RED)
            .filter(d => d[0] == seats)
            .attr("fill", d => d[0] >= 51 ? DARK_BLUE : DARK_RED);
    };
    let mstop = function() {
        tt_gop.style("visibility", "hidden");
        tt_dem.style("visibility", "hidden");
        triangle.style("visibility", "hidden");
        rects.attr("fill", d => d[0] >= 51 ? BLUE : RED);
    }

    svg.on("mousemove", mmv);
    svg.on("touchmove", mmv);
    svg.on("mouseout", mstop);
    svg.on("touchend", mstop);
}

function sim_election(sims) {
    let sim = sims[window.sim_ctr++];
    if (window.sim_ctr == sims.length) window.sim_ctr = 0;

    // CHANGE FOR FUTURE: 35 is fixed DEM seats
    let seats = 35 + sim.dem.reduce((a, b) => a+b, 0);
    let dside = seats >= 50;
    let cand = dside ? "Democrats" : "Republicans";
    seats = dside ? seats : 100 - seats;
    let gain = dside ? seats - 47 : seats - 53;

    if (seats == 50) {
        $("#map_sim_result").innerHTML = `
            <b>Tie</b>; Control determined by the presidency
            (${d3.format(".0%")(estimates.pr_presidency)} chance
            Democrats win).`;
            return;
    }

    $("#map_sim_result").innerHTML = `
        The <b style="color: ${dside ? BLUE : RED};">
        ${cand}</b> win a majority with <b>${seats}</b> seats, 
        a <b>${gain >= 0 ? 'gain' : 'loss'} of ${Math.abs(gain)}</b> 
        seat${Math.abs(gain) == 1 ? '' : 's'}.`;

    $("#reset_map").disabled = false;
}

function table_races(data, id) {
    let table = d3.select(id).select("tbody");

    data.map(d => {
        d.margin = 200*d.dem_exp - 100;
        if (d.race == "GA-S") d.race_name = "Georgia (special)";
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

    let rows = table.selectAll("tr.race")
        .data(data)
        .enter().append("tr")
        .attr("class", "race")
        .style("background", d => d.inc * Math.sign(d.margin) < 0 ? 
               "#00000011" : "");

    rows.append("td")
        .text(d => bigScreen ? d.race_name : abbrs[d.race])
        .on("click", d => {
            race_select(d.race)
            $("#race").scrollIntoView();
            window.scrollBy(0, -56);
        });

    rows.append("td")
        .text(d => ["Rep.", "none", "Dem."][d.inc + 1])
        .style("font-weight", "bold")
        .style("color", d => [RED, "", BLUE][d.inc + 1]);

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

    let sort_fun = (a, b) => d3.ascending(Math.abs(a.margin), Math.abs(b.margin));
    rows.sort(sort_fun);

    let more_state = true;
    let button = $("#show");
    button.onclick = function() {
        more_state = !more_state;
        button.innerHTML = more_state ? "Show more races" : "Show fewer races";
        d3.select("#races").classed("minim", more_state);
        if (more_state) {
            $("#races").scrollIntoView();
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
            case "race":
                ext_fun = d => d.race_name;
                break;
            case "inc":
                ext_fun = d => d.inc;
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
        }

        headers.classed("selected", false);
        d3.select(this).classed("selected", true);

        sort_fun = (a, b) => order(ext_fun(a), ext_fun(b)) || 
            d3.ascending(Math.abs(a.margin), Math.abs(b.margin));
        rows.sort(sort_fun);
    });
}

function setup_filter_sim(sims, key_races, id) {

    let races = key_races.slice(0, 12).map(d => {
        d.winner = -1;
        d.sim_prob = d.prob;
        d.idx = estimates.races.findIndex(s => s.race == d.race);
        return d;
    });
    window.st = races;

    let buttons = d3.select(id)
        .selectAll("div.button")
        .data(races)
        .enter().append("div")
        .attr("class", "button")
        .text(d => d.race);

    let updateSim = function() {
        let filtered = sims.filter(sim => {
            for (s of races) {
                if (s.winner >= 0 && sim.dem[s.idx] != s.winner)
                    return false;
            }
            return true;
        });

        let selected = 0;
        races.map(s => {
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
                Please un-select a few races.`;
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

        let prob = d3.mean(filtered.map(sim => +(sim.seats >= 50)));
        let dside = prob > 0.5;
        let cand = dside ? "Democrats" : "Republicans";

        $("#filter_sum").innerHTML = `
        The <b style="color: ${dside ? BLUE : RED};">${cand}</b> 
        would have a <b>${probToText(dside ? prob : 1 - prob)}</b>
        chance of winning.`;

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
        races.map(s => { s.winner = -1; });
        updateSim();
    };
    
    buttons.on("click", toggleState);
    $("#reset_races").onclick = resetAll;
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
