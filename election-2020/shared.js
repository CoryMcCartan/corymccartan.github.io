const BLUE = "#67f";
const LIGHT_BLUE = "#79f";
const DARK_BLUE = "#56c";
const RED = "#f76";
const LIGHT_RED = "#f99";
const DARK_RED = "#c65";
const BLK = "#444";

const electionDay = new Date("11/3/2020");

let bigScreen = window.innerWidth > 600;
let fullScreen = window.innerWidth > 960;
window.fontSize = innerWidth < 500 ? 11 : 12;

const nums =   [1,   1,  1,  1,  1,  1,  1,  1, 1, 1, 1, 1, 1, 3, 1, 3, 2, 4, 1]
const denoms = [100, 50, 40, 20, 15, 12, 10, 9, 8, 7, 6, 5, 4, 10, 3, 7, 5, 9, 2];

window.$ = s => document.querySelector(s);
window.LOG = function(val) {
    console.log(val);
    return val;
};

function probToText(prob) {
    if (prob < 0.005)
        return "<1 in 100";
    else if (prob > 0.995)
        return ">99 in 100";

    let p = Math.min(prob, 1 - prob);
    let dists = nums.map((n, i) => Math.abs(n/denoms[i] - p));
    let idx = dists.indexOf(Math.min.apply(null, dists));
    if (p == prob) 
        return `${nums[idx]} in ${denoms[idx]}`;
    else 
        return `${denoms[idx] - nums[idx]} in ${denoms[idx]}`;
}


function chart_line(data, id, key, bounds, opts) {
    let maxdate = d3.max(data, d => d.date);
    let today = +(opts.today || maxdate);
    const dy = 1000*3600*24;

    let container = d3.select(id);
    const h = opts.h || (bigScreen ? 340 : 240);
    let mult = opts.halfwidth && bigScreen ? 0.5 : 1;
    const w = container.node().getBoundingClientRect().width * mult;
    let margin = {
        top: 32, 
        left: 20 + (opts.addl_left || 0), 
        right: (electionDay - today)/(7*dy) < 2 ? 48 : 20, 
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
        .ticks((bigScreen && !opts.halfwidth) ? 8 : 4);
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
                .y0(d => y(+d[min_key]))
                .y1(d => y(+d[max_key]))
                .curve(curve_func);
            gop_err = d3.area()
                .x(d => x(d.date))
                .y0(d => y(opts.refl - +d[max_key]))
                .y1(d => y(opts.refl - +d[min_key]))
                .curve(curve_func);
            dem_err2 = d3.area()
                .x(d => x(d.date))
                .y0(d => y(+d[q25_key]))
                .y1(d => y(+d[q75_key]))
                .curve(curve_func);
            gop_err2 = d3.area()
                .x(d => x(d.date))
                .y0(d => y(opts.refl - +d[q75_key]))
                .y1(d => y(opts.refl - +d[q25_key]))
                .curve(curve_func);
        } else if (!!opts.hrule) {
            dem_err = d3.area()
                .x(d => x(d.date))
                .y0(d => Math.min(y(+d[min_key]), y(opts.hrule)))
                .y1(d => Math.min(y(+d[max_key]), y(opts.hrule)))
                .curve(curve_func);
            gop_err = d3.area()
                .x(d => x(d.date))
                .y0(d => Math.max(y(+d[min_key]), y(opts.hrule)))
                .y1(d => Math.max(y(+d[max_key]), y(opts.hrule)))
                .curve(curve_func);
            dem_err2 = d3.area()
                .x(d => x(d.date))
                .y0(d => Math.min(y(+d[q25_key]), y(opts.hrule)))
                .y1(d => Math.min(y(+d[q75_key]), y(opts.hrule)))
                .curve(curve_func);
            gop_err2 = d3.area()
                .x(d => x(d.date))
                .y0(d => Math.max(y(+d[q25_key]), y(opts.hrule)))
                .y1(d => Math.max(y(+d[q75_key]), y(opts.hrule)))
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
            .y(d => y(opts.refl - +d[line_key]))
            .curve(curve_func);
        if (!!opts.series2) {
            gop_line = d3.line()
                .x(d => x(d.date))
                .y(d => y(+d[opts.series2]))
                .curve(curve_func);
        }

        chart.append("path")
            .datum(data.filter(d => d.date <= today + 1*dy))
            .attr("class", "line")
            .attr("d", dem_line)
            .attr("stroke", opts.color || BLUE);
        chart.append("path")
            .datum(data.filter(d => d.date >= today - 1*dy))
            .attr("class", "line")
            .attr("class", "line")
            .attr("d", dem_line)
            .attr("stroke-dasharray", [4, 3])
            .attr("stroke", opts.color || BLUE);
        chart.append("path")
            .datum(data.filter(d => d.date <= today + 1*dy))
            .attr("class", "line")
            .attr("d", gop_line)
            .attr("stroke", RED);
        chart.append("path")
            .datum(data.filter(d => d.date >= today - 1*dy))
            .attr("class", "line")
            .attr("class", "line")
            .attr("d", gop_line)
            .attr("stroke-dasharray", [4, 3])
            .attr("stroke", RED);
    } else if (!!opts.hrule) {
        chart.append("path")
            .datum(data.filter(d => +d[line_key] >= opts.hrule
                               && d.date <= today + 2*dy))
            .attr("class", "line")
            .attr("d", dem_line)
            .attr("stroke", opts.color || BLUE);
        chart.append("path")
            .datum(data.filter(d => +d[line_key] < opts.hrule 
                               && d.date <= today + 2*dy))
            .attr("class", "line")
            .attr("d", dem_line)
            .attr("stroke", opts.color || RED);
        chart.append("path")
            .datum(data.filter(d => +d[line_key] >= opts.hrule 
                               && d.date >= today - 5*dy))
            .attr("class", "line")
            .attr("d", dem_line)
            .attr("stroke-dasharray", [4, 3])
            .attr("stroke", opts.color || BLUE);
        chart.append("path")
            .datum(data.filter(d => +d[line_key] < opts.hrule 
                               && d.date >= today - 5*dy))
            .attr("class", "line")
            .attr("d", dem_line)
            .attr("stroke-dasharray", [4, 3])
            .attr("stroke", opts.color || RED);
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

    let one_label = !opts.refl && !opts.series2;
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
        .attr("fill", one_label ? "#666" : opts.color || BLUE);
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
            let val = opts.refl - d_today[line_key];
            if (!!opts.series2) val = d_today[opts.series2];
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
            if (!!opts.series2) val = closest[opts.series2];
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
    let table = d3.select(container).select("tbody");

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
        .style("border-right", "1px solid " + BLK)
        .style("padding-left", "4px");
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
