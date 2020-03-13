const BLUE = "#67f";
const LIGHT_BLUE = "#79f";
const DARK_BLUE = "#56c";
const RED = "#f76";
const LIGHT_RED = "#f99";
const DARK_RED = "#c65";
const BLK = "#444";

const currentSeats = 235;
const electionDay = new Date("11/3/2020");
const MOE = 1.64;

let bigScreen = window.innerWidth > 600;
let fullScreen = window.innerWidth > 960;

/*
 * Create histogram
 */
function chart_histogram(data, id) {
    let container = d3.select(id);
    const h = bigScreen ? 240 : 160;
    const w = container.node().getBoundingClientRect().width;
    const gap = 40;
    const min = 218 - Math.max(Math.abs(218 - data.s_min), 
                               Math.abs(218 - data.s_max)) 
               + (bigScreen ? 5 : 15);
    const max = 218 + (218 - min);
    const total = d3.sum(data.hist);

    let svg = container.append("svg")
        .attr("width", w)
        .attr("height", h);

    let seats = data.hist.map((c, i) => [data.s_min + i, c]);
    let x = d3.scaleLinear()
        .domain([min, max])
        .range([0, w]);
    let y = d3.scaleLinear()
        .domain([0, d3.max(data.hist)])
        .range([h, gap]);
    let axis = d3.axisBottom(x)
        .ticks(bigScreen ? 8 : 5)
        .tickSize(8)
        .tickSizeOuter(0);

    let rects = svg.append("g")
        .classed("hist", true)
        .selectAll("rect")
        .data(seats)
        .enter().append("rect")
        .attr("x", -0.3)
        .attr("fill", d => d[0] >= 218 ? BLUE : RED)
        .attr("transform", d => `translate(${x(d[0])}, ${y(d[1])})`)
        .attr("width", d => x(d[0]+1) - x(d[0]) + 0.6)
        .attr("height", d => h - y(d[1]));
    svg.append("g")
        .attr("transform", `translate(0, ${h})`)
        .call(axis)
        .attr("opacity", 0.7);

    svg.append("text")
        .attr("x", w - 3)
        .attr("y", h -3)
        .attr("text-anchor", "end")
        .classed("label", true)
        .text("DEM. SEATS");

    // MAJORITY LABEL
    lbl_maj = svg.append("g")
        .attr("transform", d => `translate(${x(218)}, 0)`);
    lbl_maj.append("line")
        //.attr("y1", gap - 8)
        .attr("y1", y(seats[218 - data.s_min][1]))
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
            .text("← REP. MAJORITY");
        lbl_maj.append("text")
            .attr("font-size", "8pt")
            .attr("font-weight", "bold")
            .attr("opacity", 0.7)
            .attr("y", h - 3)
            .attr("x", 3)
            .text("DEM. MAJORITY →");
    }
        
    // AVG SEATS LABEL
    lbl_avg = svg.append("g")
        .attr("transform", d => `translate(${x(data.s_exp+0.5)}, 0)`);
    lbl_avg.append("line")
        .attr("y1", gap - 26)
        .attr("y2", h)
        .attr("stroke", BLK)
        .attr("stroke-width", 1);
    lbl_avg.append("text")
        .classed("label", true)
        .attr("text-anchor", "middle")
        .attr("y", gap - 28)
        .text(`${data.s_exp} EXPECTED`);

    // CURRENT SEATS LABEL
    cur_seats = data.s_exp - data.gain;
    lbl_cur = svg.append("g")
        .attr("transform", d => `translate(${x(cur_seats+0.5)}, 0)`);
    lbl_cur.append("line")
        .attr("y1", gap - 8)
        .attr("y2", h)
        .attr("stroke", BLK)
        .attr("stroke-width", 1);
    lbl_cur.append("rect")
        .attr("x", -30)
        .attr("width", 60)
        .attr("y", gap - 21)
        .attr("height", 13)
        .attr("fill", "#f4f4f4");
    lbl_cur.append("text")
        .classed("label", true)
        .attr("text-anchor", "middle")
        .attr("y", gap - 10)
        .text(`${cur_seats} LAST ELECTION`);

    // EXP. GAIN LABEL
    lbl_sum = svg.append("g")
        .attr("transform", d => `translate(${x(data.s_exp+0.5)}, ${h*0.75})`);
    lbl_sum.append("text")
        .attr("x", 2)
        .attr("class", "hist-gain")
        .attr("font-size", bigScreen ? "30pt" : "20pt")
        .text(d3.format("+")(data.gain));
    lbl_sum.append("text")
        .attr("x", 4)
        .attr("y", bigScreen ? 20 : 15)
        .attr("class", "hist-gain")
        .attr("font-size", "12pt")
        .text(data.gain >= 0 ? "GAIN" : "LOSS");

    // CI line
    svg.append("line")
        .attr("x1", x(data.s_q05))
        .attr("x2", x(data.s_q95))
        .attr("y1", h+2.5)
        .attr("y2", h+2.5)
        .attr("stroke", BLK)
        .attr("stroke-width", 4);

    
    // TOOLTIPS
    let tt = container.append("div")
        .attr("class", "tooltip")
        .style("visibility", "hidden");
    let triangle = svg.append("text")
        .attr("fill", "#777")
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .text("▼")
        .style("visibility", "hidden");

    let bisector = d3.bisector(d => d.date).left;
    let fmt = d3.format(".0%");
    fmt = probToText;
    let mmv = function() {
        let [mx, my] = d3.mouse(svg.node());
        if (mx > w) mx = w;
        if (mx < 0) mx = 0;

        let seats = Math.round(x.invert(mx));
        let party = seats >= 218 ? "Democrats" : "Republicans";
        let color = seats >= 218 ? BLUE : RED;
        let dir;
        if (bigScreen) dir = seats < data.s_exp ? "left" : "right";
        else dir = data.s_exp >= 218 ? "left" : "right";

        let pct = d3.sum(data.hist.slice(seats - data.s_min)) / total; 
        if (seats > data.s_max) pct = 0;
        if (seats < data.s_min) pct = 1;
        if (seats < 218) pct = 1 - pct;
        let disp_seats = seats < 218 ? 435 - seats : seats;

        let txt = (`The <span style="color: ${color}; font-weight: bold;">`
                   + `${party}</span> have a <b>${fmt(pct)} chance</b> `
                   + `of winning at least <b>${disp_seats} seats</b>.`);
        tt.style("visibility", "visible")
            .html(txt)
            .style("text-align", dir)
            .style("left", null)
            .style("right", null)
            .style(dir, bigScreen ? "1em" : "0.5em");

        if (pct < 0.05) {
            let tri_value = data.hist[seats - data.s_min];
            if (seats > data.s_max || seats < data.s_min) tri_value = 0;
            triangle.style("visibility", "visible")
                .attr("x", x(seats + 0.5))
                .attr("y", y(tri_value) - 3);
        } else {
            triangle.style("visibility", "hidden");
        }

        rects.attr("fill", d => d[0] >= 218 ? BLUE : RED)
            .filter(d => d[0] == seats)
            .attr("fill", d => d[0] >= 218 ? DARK_BLUE : DARK_RED);
    };
    let mstop = function() {
        tt.style("visibility", "hidden");
        triangle.style("visibility", "hidden");
        rects.attr("fill", d => d[0] >= 218 ? BLUE : RED);
    }

    svg.on("mousemove", mmv);
    svg.on("touchmove", mmv);
    svg.on("mouseout", mstop);
    svg.on("touchend", mstop);
}

function chart_line(data, id, key, bounds, opts) {
    let maxdate = d3.max(data, d => d.date);
    let today = opts.today || maxdate;
    const wk = 1000*3600*24;

    let container = d3.select(id);
    const h = opts.h || (bigScreen ? 340 : 240);
    const w = container.node().getBoundingClientRect().width;
    let margin = {
        top: 32, 
        left: 20 + (opts.addl_left || 0), 
        right: (electionDay - today)/wk < 2 ? 48 : 20, 
        bottom: 20
    };
    let iw = w - margin.left - margin.right;
    let ih = h - margin.top - margin.bottom;

    let curve_func = opts.smooth ? d3.curveBasis : d3.curveLinear;

    let line_key = bounds ? key + "_exp" : key;
    let max_key = bounds ? key + "_q95" : key;
    let min_key = bounds ? key + "_q05" : key;
    let q25_key = bounds ? key + "_q75" : key;
    let q75_key = bounds ? key + "_q25" : key;

    let svg = container.append("svg")
        .attr("width", w)
        .attr("height", h);
    let chart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    if (!("ymin" in opts))
        opts.ymin = Math.min(
            d3.min(data, d => +d[min_key]),
            !!opts.refl ? opts.refl - d3.max(data, d => +d[max_key]) : Infinity
        );
    if (!("ymax" in opts))
        opts.ymax = Math.max(
            d3.max(data, d => +d[max_key]),
            !!opts.refl ? opts.refl - d3.min(data, d => +d[min_key]) : -Infinity
        );
    if ("pad" in opts) {
        let padding = opts.pad * (opts.ymax - opts.ymin); 
        opts.ymin -= padding;
        opts.ymax += padding;
    }

    let x = d3.scaleTime()
        .domain([d3.min(data, d => d.date), electionDay])
        .range([0, iw]);
    let y = d3.scaleLinear()
        .domain([opts.ymin, opts.ymax])
        .range([ih, 0]);

    // axes
    let x_axis = d3.axisBottom(x)
        .tickSizeOuter(0)
        .ticks(bigScreen ? 8 : 4);
    let y_axis = d3.axisLeft(y)
        .ticks(bigScreen ? 7 : 6)
        .tickSizeInner(-iw)
        .tickFormat(opts.format);
    chart.append("g")
        .attr("class", "y axis")
        .call(y_axis);
    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${ih})`)
        .call(x_axis);

    chart.append("text")
        .attr("class", "title")
        .attr("text-anchor", "start")
        .attr("y", -16)
        .attr("x", -margin.left)
        .text(opts.title);

    if (opts.pts) {
        chart.selectAll("circle")
            .data(opts.pts)
            .enter().append("circle")
            .attr("r", 2)
            .attr("opacity", 0.5)
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(+d[opts.pts_key]));
    }

    if (bounds) {
        let dem_err, gop_err;
        let dem_err2, gop_err2;
        if (!!opts.refl) {
            dem_err = d3.area()
                .x(d => x(d.date))
                .y0(d => y(d[min_key]))
                .y1(d => y(d[max_key]))
                .curve(curve_func);
            gop_err = d3.area()
                .x(d => x(d.date))
                .y0(d => y(opts.refl - d[max_key]))
                .y1(d => y(opts.refl - d[min_key]))
                .curve(curve_func);
            dem_err2 = d3.area()
                .x(d => x(d.date))
                .y0(d => y(d[q25_key]))
                .y1(d => y(d[q75_key]))
                .curve(curve_func);
            gop_err2 = d3.area()
                .x(d => x(d.date))
                .y0(d => y(opts.refl - d[q75_key]))
                .y1(d => y(opts.refl - d[q25_key]))
                .curve(curve_func);
        } else if (!!opts.hrule) {
            dem_err = d3.area()
                .x(d => x(d.date))
                .y0(d => Math.min(y(d[min_key]), y(opts.hrule)))
                .y1(d => Math.min(y(d[max_key]), y(opts.hrule)))
                .curve(curve_func);
            gop_err = d3.area()
                .x(d => x(d.date))
                .y0(d => Math.max(y(d[min_key]), y(opts.hrule)))
                .y1(d => Math.max(y(d[max_key]), y(opts.hrule)))
                .curve(curve_func);
            dem_err2 = d3.area()
                .x(d => x(d.date))
                .y0(d => Math.min(y(d[q25_key]), y(opts.hrule)))
                .y1(d => Math.min(y(d[q75_key]), y(opts.hrule)))
                .curve(curve_func);
            gop_err2 = d3.area()
                .x(d => x(d.date))
                .y0(d => Math.max(y(d[q25_key]), y(opts.hrule)))
                .y1(d => Math.max(y(d[q75_key]), y(opts.hrule)))
                .curve(curve_func);
        }

        chart.append("path")
            .datum(data)
            .attr("d", dem_err)
            .attr("fill", BLUE)
            .attr("opacity", 0.5);
        chart.append("path")
            .datum(data)
            .attr("d", gop_err)
            .attr("fill", RED)
            .attr("opacity", 0.5);
        chart.append("path")
            .datum(data)
            .attr("d", dem_err2)
            .attr("fill", BLUE)
            .attr("opacity", 0.4);
        chart.append("path")
            .datum(data)
            .attr("d", gop_err2)
            .attr("fill", RED)
            .attr("opacity", 0.4);
    }
        
    // lines
    let dem_line = d3.line()
        .x(d => x(d.date))
        .y(d => y(+d[line_key]))
        .curve(curve_func);
    if (!!opts.refl) {
        let gop_line = d3.line()
            .x(d => x(d.date))
            .y(d => y(opts.refl - d[line_key]))
            .curve(curve_func);

        chart.append("path")
            .datum(data.filter(d => d.date <= today))
            .attr("class", "line")
            .attr("d", dem_line)
            .attr("stroke", BLUE);
        chart.append("path")
            .datum(data.filter(d => d.date >= today - 7*wk))
            .attr("class", "line")
            .attr("class", "line")
            .attr("d", dem_line)
            .attr("stroke-dasharray", [4, 3])
            .attr("stroke", BLUE);
        chart.append("path")
            .datum(data.filter(d => d.date <= today))
            .attr("class", "line")
            .attr("d", gop_line)
            .attr("stroke", RED);
        chart.append("path")
            .datum(data.filter(d => d.date >= today - 7*wk))
            .attr("class", "line")
            .attr("class", "line")
            .attr("d", gop_line)
            .attr("stroke-dasharray", [4, 3])
            .attr("stroke", RED);
    } else if (!!opts.hrule) {
        chart.append("path")
            .datum(data.filter(d => +d[line_key] >= opts.hrule && d.date <= today))
            .attr("class", "line")
            .attr("d", dem_line)
            .attr("stroke", BLUE);
        chart.append("path")
            .datum(data.filter(d => +d[line_key] < opts.hrule && d.date <= today))
            .attr("class", "line")
            .attr("d", dem_line)
            .attr("stroke", RED);
        chart.append("path")
            .datum(data.filter(d => +d[line_key] >= opts.hrule 
                               && d.date >= today - 7*wk))
            .attr("class", "line")
            .attr("d", dem_line)
            .attr("stroke-dasharray", [4, 3])
            .attr("stroke", BLUE);
        chart.append("path")
            .datum(data.filter(d => +d[line_key] < opts.hrule 
                               && d.date >= today - 7*wk))
            .attr("class", "line")
            .attr("d", dem_line)
            .attr("stroke-dasharray", [4, 3])
            .attr("stroke", RED);
    }

    if (!!opts.hrule) {
        chart.append("line")
            .attr("x1", 0)
            .attr("x2", iw)
            .attr("y1", y(opts.hrule))
            .attr("y2", y(opts.hrule))
            .attr("stroke-width", 1)
            .attr("stroke", "#888");
        chart.append("text")
            .attr("x", 4)
            .attr("y", y(opts.hrule) - 2)
            .attr("class", "label")
            .attr("opacity", 0.7)
            .attr("text-anchor", "start")
            .text(opts.hrule_label);
    }

    let tooltip = chart.append("g");
    let tt_rect = tooltip.append("rect")
        .attr("height", ih)
        .attr("opacity", 0.5)
        .attr("fill", "#f4f4f4");
    let tt_dem = tooltip.append("text")
        .attr("x", 2)
        .attr("dy", !!opts.dodge ? -4 : 0)
        .attr("class", "tooltip")
        .attr("alignment-baseline", !!opts.dodge ? "baseline": "middle")
        .attr("fill", BLUE);
    let tt_gop = tooltip.append("text")
        .attr("x", 2)
        .attr("class", "tooltip")
        .attr("alignment-baseline", "middle")
        .attr("fill", RED);
    let tt_label = tooltip.append("text")
        .attr("y", -2)
        .attr("class", "label")
        .attr("text-anchor", "middle");
    tooltip.append("line")
        .attr("y1", 0)
        .attr("y2", ih)
        .attr("stroke-width", 1)
        .attr("stroke", BLK);
    tooltip.append("text")
        .attr("y", 7)
        .attr("fill", BLK)
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .text("▼");

    let ed_box = chart.append("g")
        .attr("transform", `translate(${x(electionDay)}, 0)`);
    ed_box.append("line")
        .attr("y1", 0)
        .attr("y2", ih)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", [2, 2])
        .attr("stroke", BLK);
    ed_box.append("text")
        .attr("y", 7)
        .attr("fill", BLK)
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .text("▼");
    let ed_label = ed_box.append("text")
        .attr("y", -2)
        .attr("x", 12)
        .attr("class", "label")
        .attr("text-anchor", "end")
        .text(today >= new Date("2020-09-15") ? "" : "ELECTION DAY");

    let bisector = d3.bisector(d => d.date).left;
    let last = data.length - 1;
    let date_fmt = (x => d3.timeFormat(bigScreen ? "%B %-d" : "%b %-d")(x)
        .toUpperCase());

    let tt_fmt = opts.tooltip_format || (x => x);
    let reset_tt = function() {
        tooltip.attr("transform", `translate(${x(today)}, 0)`);
        tt_label.text("TODAY");
        ed_label.attr("visibility", "visible");

        d_today = data[bisector(data, today)];
        tt_rect.attr("width", iw - x(today))
        tt_dem.text(tt_fmt(d_today[line_key]))
            .attr("y", y(d_today[line_key]));
        if (!!opts.refl) {
            let val = opts.refl - d_today[line_key]
            tt_gop.text(tt_fmt(val))
                .attr("y", y(val));
        } else {
            tt_gop.attr("visibility", "hidden");
        }
    };
    reset_tt();

    mmv = function() {
        let [mx, my] = d3.mouse(chart.node());

        if (mx > w) mx = w;
        if (mx < 0) mx = 0;

        let xval = new Date(Math.min(x.invert(mx), maxdate));
        let idx = bisector(data, xval);
        let closest = data[Math.min(last, idx)];
        mx = x(xval);

        tooltip.attr("transform", `translate(${mx}, 0)`);
        tt_rect.attr("width", w - mx);
        tt_label.text(date_fmt(xval));

        tt_dem.text(tt_fmt(closest[line_key]))
            .attr("y", y(closest[line_key]));
        if (!!opts.refl) {
            let val = opts.refl - closest[line_key]
            tt_gop.text(tt_fmt(val))
                .attr("y", y(val));
        }

        ed_label.attr("visibility", "hidden");
    };
    svg.on("mousemove", mmv)
    svg.on("touchmove", mmv)
    svg.on("mouseout", reset_tt);
    svg.on("touchend", reset_tt);
}


function table_firms(data, container) {
    table = d3.select(container);

    data.sort((a, b) => a.effect - b.effect);
    x = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.abs(d.effect))])
        .range([0, 100]);

    rows = table.selectAll("tr.firm")
        .data(data)
        .enter().append("tr")
        .attr("class", "firm");

    eff_fmt = d3.format("+.2%");
    rows.append("td")
        .text(d => d.firm);
    rows.append("td")
        .style("text-align", "right")
        .text(d => d.n);

    let cell_l = rows.append("td")
        .style("text-align", "right")
        .style("border-right", "1px solid " + BLK);
    cell_l.filter(d => d.effect < 0)
        .append("div")
        .style("width", d => Math.round(x(-d.effect)) + "%")
        .style("background", RED)
        .attr("class", "gop bar");
    cell_l.filter(d => d.effect >= 0)
        .text(d => eff_fmt(d.effect))
        .style("padding-right", "4px")
        .style("color", BLUE);

    let cell_r = rows.append("td");
    cell_r.filter(d => d.effect >= 0)
        .append("div")
        .style("width", d => Math.round(x(d.effect)) + "%")
        .style("background", BLUE)
        .attr("class", "dem bar");
    cell_r.filter(d => d.effect < 0)
        .text(d => eff_fmt(d.effect))
        .style("padding-left", "4px")
        .style("color", RED);
}


