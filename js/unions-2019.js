"use strict";

async function load_data() {
    let intls = await d3.csv("/data/unions/internationals_2018.csv", d3.autoType)
    intls = intls.map(d => {
        d.union_name = d.union_name
            .replace(", AFL-CIO", "")
            .replace(", AFLCIO", "")
            .replace(" AFL-CIO", "")
            .replace(" AFLCIO", "")
            .replace(", IND", "")
            .replace(" IND", "")
            .replace(" WKRS", " WORKERS")
            .replace(" EMPLS", " EMPLOYEES")
            .replace(" ASN", " ASSOCIATION")
            .replace(" DEPT", " DEPARTMENT");
        return d;
    });
    window.intls = intls;
}

async function main() {
    await load_data();

    // TOOLTIP
    window.tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("width", "180px")
        .html("testing...");

    tooltip.show = () => tooltip.style("visibility", "visible");
    tooltip.hide = () => tooltip.style("visibility", "hidden");
    tooltip.hide();

    // CHARTS
    let a1_container = d3.select("#intl-chart-a1");
    let a2_container = d3.select("#intl-chart-a2");
    window.w = d3.select("article").node().getBoundingClientRect().width;
    window.h = innerHeight - d3.select("header").node().getBoundingClientRect().height;

    //a1_bubbleChart(a1_container, "net_assets", 12, 16);
    window.a1_chart = a1_bubbleChart(a1_container);

    window.box_x = (x, w) => x - pageXOffset > innerWidth - 180 ? x - 192 : x + 16;
    window.box_y = (y, h) => y - pageYOffset > innerHeight - 140 ? y - 120 : y - 16;
    d3.select(window).on("scroll", tooltip.hide);

    window.a2_chart = a2_bubbleChart(a2_container, d => d.eq_pc, 15,
                                     "Net assets / member", "$,.0f", true,
                                     "", "More assets per member");

    // SCENE DATA
    let walmart_dod = [{
        abbr: "Walmart",
        radius: a1_chart.scales.radius(2.2e6), 
        color: "#666", cx: w/2, cy: h/2, 
    }, {
        abbr: "DoD",
        radius: a1_chart.scales.radius(3.2e6), 
        color: "#666", cx: w/2, cy: h/2, 
    }];

    let a1s10_unions = ["NEA", "AFT", "SEIU", "IBT", "UFCW", "AFSCME", "RWAW"];
    let a1s40_unions = ["UAW", "USW", "CJA", "IBEW"];
    let a2s20_unions = ["ATDA", "UAW", "NEA"];
    let a2s40_unions = ["AFT", "AFGE", "UAW", "CJA"];
    let a2s45_unions = ["SEIU", "AFA", "AFSCME", "IAFF", "IBEW", "IUJAT"];

    // SCROLLING SCENES
    let controller = new ScrollMagic.Controller();
    controller.addScene([
        // ACT ONE ===============================================
        new ScrollMagic.Scene({
            triggerElement: "#a1",
            triggerHook: 1,
            //duration: "460%",
        })
        .on("enter", () => a1_chart.rescale("members")),

        new ScrollMagic.Scene({
            triggerElement: a1_container.node(),
            triggerHook: 1,
            offset: h,
            duration: "550%",
        })
        .setPin(a1_container.node(), { pushFollowers: false }),

        new ScrollMagic.Scene({
            triggerElement: "#a1s20",
            triggerHook: 0.95,
            duration: "90%",
        })
        .on("enter", () => a1_chart.highlight(a1s10_unions, true))
        .on("leave", () => a1_chart.highlight(a1s10_unions, false)),

        new ScrollMagic.Scene({
            triggerElement: "#a1s30",
            triggerHook: 0.8,
            duration: "70%",
        })
        .on("enter", () => {
            a1_chart.data.push(walmart_dod[0]);
            a1_chart.data.push(walmart_dod[1]);
            a1_chart.add(a1_chart.data, 0.12);
        })
        .on("leave", () => {
            if (a1_chart.data[a1_chart.data.length-1].abbr == "DoD") {
                a1_chart.data.pop();
                a1_chart.data.pop();
            }
            a1_chart.add(a1_chart.data, 0.1);
        }),

        new ScrollMagic.Scene({
            triggerElement: "#a1s40",
            triggerHook: 0.8,
            duration: "100%",
        })
        .on("enter", e => {
            a1_chart.highlight(a1s40_unions, true);
            if (e.scrollDirection == "FORWARD")
                a1_chart.rescale("net_assets", 8, 15);
        })
        .on("leave", e => {
            a1_chart.highlight(a1s40_unions, false);
            if (e.scrollDirection == "REVERSE")
                a1_chart.rescale("members");
        }),

        new ScrollMagic.Scene({
            triggerElement: "#a1s50",
            triggerHook: 0.7,
            duration: "70%",
        })
        .on("enter", () => {
            a1_chart.data.push({
                abbr: "BRK",
                radius: a1_chart.scales.radius(348.7e9), 
                //radius: a1_chart.scales.radius(2e9), 
                color: "#666", cx: w/2, cy: h/2, 
            });
            a1_chart.add(a1_chart.data, 0.05);
            a1_chart.highlight(["UFCW"], true);
            a1_container.selectAll("g.intl text")
                .filter(d => d.abbr=="BRK")
                .attr("y", d => d.radius*0.6)
                .attr("x", d => d.radius*0.3)
                .attr("font-size", d => d.radius/4.5)
        })
        .on("leave", () => {
            a1_chart.data.pop();
            a1_chart.add(a1_chart.data, 0.5);
            a1_chart.highlight(["UFCW"], false);
        }),

        // ACT TWO ===============================================
        new ScrollMagic.Scene({
            triggerElement: "#a2s20",
            triggerHook: 0.4,
            duration: "40%",
        })
        .on("enter", () => a2_chart.highlight(a2s20_unions, true))
        .on("leave", () => a2_chart.highlight(a2s20_unions, false)),

        new ScrollMagic.Scene({
            triggerElement: a2_container.node(), triggerHook: 1,
            offset: h,
            duration: "820%",
        })
        .setPin(a2_container.node(), { pushFollowers: false }),

        new ScrollMagic.Scene({
            triggerElement: "#a2s30",
            triggerHook: 0.8,
            duration: "100%",
        })
        .on("enter", () => {
            a2_chart.reorder(d => d.disbursements / d.members, 15, 
                             "Spending / member", "$,.0f", true, true, 
                             "", "More spending per member");
            a2_chart.highlight(["IBEW", "UAW"], true)
        })
        .on("leave", e => {
            a2_chart.highlight(["IBEW", "UAW"], false);
            if (e.scrollDirection != "REVERSE") return;
            a2_chart.reorder(d => d.eq_pc, 15, 
                             "Net assets / member", "$,.0f", true, true,
                             "", "More assets per member");
        }),

        new ScrollMagic.Scene({
            triggerElement: "#a2s40",
            triggerHook: 0.8,
            duration: "200%",
        })
        .on("enter", () => {
            a2_chart.reorder(d => d.disbursements / d.assets, 0.1, 
                             "Spending / assets", ".2r", true, true, 
                             "Savers", "Spenders");
            a2_chart.highlight(a2s40_unions, true);
        })
        .on("leave", e => {
            a2_chart.highlight(a2s40_unions, false);
        }),

        new ScrollMagic.Scene({
            triggerElement: "#a2s45",
            triggerHook: 0.25,
            duration: "380%",
        })
        .on("enter", () => a2_chart.highlight(a2s45_unions, true))
        .on("leave", () => a2_chart.highlight(a2s45_unions, false)),

        new ScrollMagic.Scene({
            triggerElement: "#a2s50",
            triggerHook: 0.8,
            duration: "100%",
        })
        .on("enter", () => {
            a2_chart.reorder(d => (d.represent + d.strike_benefits) / d.disbursements, 0.0, 
                             "Pct. representational", ".0%", true, false);
        }),

        new ScrollMagic.Scene({
            triggerElement: "#a2s70",
            triggerHook: 0.8,
            duration: "100%",
        })
        .on("enter", () => {
            a2_chart.reorder(d => d.political / d.disbursements, 0.002, 
                             "Pct. political", ".1%", true, true);
        }),

        new ScrollMagic.Scene({
            triggerElement: "#a2s80",
            triggerHook: 0.8,
            duration: "100%",
        })
        .on("enter", () => {
            a2_chart.reorder(d => (d.overhead + d.admin) / d.disbursements, 0.0, 
                             "Pct. overhead", ".0%", true, false);
        }),
    ]);

}

window.palette = ["#5fb0e6", "#73bc5e", "#eebc3b", "#8c54b0", "#4c6060"];

function a1_bubbleChart(container, radius="members", r_scale=10, r_div=11) {
    let svg = container.append("svg");
    svg.attr("width", w)
        .attr("height", h);

    let scales = {
        radius: d3.scalePow()
            .exponent(0.5)
            .domain([0, d3.max(intls.map(d => d[radius]))])
            .range([w < 400 ? 2 : 4, r_scale + w/r_div]),
    };
    let colors = {"AFL-CIO": palette[0], "CTW": palette[1], "INDEP": palette[2]};
    let centers = {
        "AFL-CIO": [w*0.35, h*0.4],
        "CTW": [w*0.5, h*0.52],
        "INDEP": [w*0.55, h*0.44],
    };

    let data = intls.filter(d => d.members > 50)
    .map(d => {
        d = {...d};
        d.radius = Math.max(2, scales.radius(d[radius]));
        d.cy = centers[d.affl][1];
        d.color= colors[d.affl];
        d.cx = centers[d.affl][0];
        return d;
    });

    let nodes = svg.selectAll("g.intl");
    let bubbles = svg.selectAll("g.intl circle");
    let labels = svg.selectAll("g.intl text");
    let add = function(newdata, alpha=0.4) {
        if (!!newdata) data = newdata;

        nodes = nodes.data(data);
        let groups = nodes.enter().append("g")
            .attr("class", "intl");
        nodes.exit()
            .transition()
            .duration(0).delay(300)
            .remove();
        nodes.exit()
            .select("circle")
            .transition()
            .duration(300)
            .attr("r", 0);

        bubbles = groups.append("circle")
            .attr("fill", d => d.color)
            .attr("r", 0)
            .merge(bubbles);
        bubbles.transition().duration(300)
            .attr("r", d => d.radius)

        labels = groups.append("text")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", d => 3*d.radius / (d.abbr.length+2))
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .attr("x", 0)
            .attr("y", d => d.radius*0.04)
            .merge(labels);

        labels.transition()
            .duration(0).delay(300)
            .text(d => d.radius > 10 ? d.abbr : "");

        nodes = groups.merge(nodes);

        if (!!newdata)
            sim.nodes(data)
                .alpha(alpha)
                .alphaDecay(1 - Math.pow(0.001, 1 / 400)) 
                .restart();
    }
    add();

    let tick = function() {
        nodes.attr("transform", d => `translate(${d.x}, ${d.y})`);
    };

    let sim = d3.forceSimulation(data)
        .force("charge", d3.forceManyBody().strength(1.5))
        .force("center", d3.forceCenter(w/2, h/2))
        .force("x", d3.forceX().x(d => d.cx).strength(0.12))
        .force("y", d3.forceY().y(d => d.cy).strength(0.16))
        .force("collision", d3.forceCollide().radius(d => d.radius+1))
        .alpha(0.2)
        .alphaDecay(1 - Math.pow(0.001, 1 / 600)) 
        .on("tick", tick);

    //----------------TOOLTIP----------------------------------
    let f_members = d3.format(",.4r");
    let f_assets = d3.format("$,.3s");
    let boxText = function(d) {
        return `<b>${d.radius > 10 ? "" : d.abbr + ": "}${d.union_name}</b><br />` +
            `${d.members < 1000 ? d.members : f_members(d.members)} members<br />` +
            `${d.locals} private or federal locals<br />` +
            `Net assets: ${f_assets(d.net_assets).replace("G", "B")}<br />` +
            `Revenues:  ${f_assets(d.receipts).replace("G", "B")}<br />` +
            `Spending:  ${f_assets(d.disbursements).replace("G", "B")}<br />` +
            `${d.officers} officers and ${d.staff} staff`;
    };

    nodes.on("mouseover", d => { tooltip.show(); tooltip.html(boxText(d)); })
        .on("mousemove", d => { 
            tooltip.style("top", box_y(event.pageY) + "px")
                .style("left", box_x(event.pageX)+ "px");
        })
        .on("mouseout", tooltip.hide);

    //----------------FUNCTIONS----------------------------------
    let rescale = function(radius, r_scale=10, r_div=11) { 
        scales.radius = d3.scalePow()
            .exponent(0.5)
            .domain([0, d3.max(intls.map(d => d[radius]))])
            .range([w < 400 ? 2 : 4, r_scale + w/r_div]);

        data = data.map(d => {
            d.radius = Math.max(2, scales.radius(d[radius]));
            return d;
        });

        bubbles.transition()
            .duration(1000)
            .attr("r", d => d.radius);
        labels.text(d => d.radius > 10 ? d.abbr : "")
            .attr("font-size", d => 3*d.radius / (d.abbr.length+2));

        sim.force("collision", d3.forceCollide().radius(d => d.radius+1))
            .alpha(0.4)
            .alphaDecay(1 - Math.pow(0.001, 1 / 400)) 
            .restart();
    };

    let highlight = function(abbrs, state) {
        nodes.filter(d => abbrs.includes(d.abbr))
            .select("circle")
            .attr("stroke-width", state ? 2 : 0)
            .attr("stroke", "#222");
    };

    return {data, rescale, add, scales, highlight, sim};
}

function a2_bubbleChart(container, stat, stat_min=1, stat_label="", 
                        fmt="$,.2f", show_axis=true, 
                        less_label="", more_label="") {
    let svg = container.append("svg");
    svg.attr("width", w)
        .attr("height", h);

    const buffer = 12;

    let scales = {
        radius: d3.scalePow()
            .exponent(0.5)
            .domain([0, d3.max(intls
                               .filter(d => stat(d) > stat_min)
                               .map(d => d.members))])
            .range([w < 400 ? 1 : 3, 8 + w/16])
    };
    let max = d3.max(intls.filter(d => d.members > 100 && !!stat(d))
                          .map(stat));
    let buf_radius = scales.radius(intls.filter(d => stat(d) == max)[0].members);
    max *= (w - 2*buffer + buf_radius) / (w - 2*buffer);
    scales.x = d3.scaleLog()
            .domain([stat_min, max])
            .range([buffer, w - buffer]);

    let colors = {"AFL-CIO": palette[0], "CTW": palette[1], "INDEP": palette[2]};

    let data = intls.map(d => {
        d = {...d};
        d.show = d.members > 100 && stat(d) > stat_min;
        d.radius = d.show ? Math.max(1, scales.radius(d.members)) : 0;
        d.color= colors[d.affl];
        d.cy = h/2;
        d.cx = scales.x(stat(d));
        d.y = d.cy;
        d.x = d.cx;
        return d;
    });

    let nodes = svg.selectAll("g.intl");
    let bubbles, labels;
    let add = function(newdata, alpha=0.4) {
        if (!!newdata) data = newdata;

        nodes = nodes.data(data);
        let groups = nodes.enter().append("g")
            .attr("class", "intl");
        nodes.exit()
            .transition()
            .duration(0).delay(300)
            .remove();
        nodes.exit()
            .select("circle")
            .transition()
            .duration(300)
            .attr("r", 0);

        groups.append("circle");
        groups.append("text");
        nodes = groups.merge(nodes);

        bubbles = svg.selectAll("g.intl circle")
            .data(data)
            .attr("fill", d => d.color)
            .attr("r", d => d.radius);

        labels = svg.selectAll("g.intl text")
            .data(data)
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle") .attr("font-size", d => 3*d.radius / (d.abbr.length+2))
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .attr("x", 0)
            .attr("y", d => d.radius*0.04)
            .text(d => d.radius > 10 ? d.abbr : "");

        if (!!newdata)
            sim.nodes(data);
    }
    add();

    let axis = d3.axisTop(scales.x)
        .ticks(w > 400 ? 12 : 6, fmt)
        .tickSizeOuter(0);
    let axisColor = "#666";
    let axis_el = svg.append("g")
        .attr("class", "axis")
        .style("visibility", show_axis ? "visible" : "hidden")
        .attr("transform", `translate(0, ${h/2 - 88 - w/5})`)
        .call(axis);
    d3.selectAll(".axis path, .axis line").attr("stroke", axisColor);
    d3.selectAll(".axis text").attr("fill", axisColor);

    let text_less = svg.append("text")
        .attr("x", buffer)
        .attr("y", h/2 - 72 - w/5)
        .attr("font-size", 12)
        .attr("fill", axisColor)
        .text(!!less_label ? "← " + less_label : "");
    let text_more = svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", w - buffer)
        .attr("y", h/2 - 72 - w/5)
        .attr("font-size", 12)
        .attr("fill", axisColor)
        .text(!!more_label ? more_label + " →" : "");

    let tick = function() {
        nodes.attr("transform", d => !!d.x ? `translate(${d.x}, ${d.y})` : "");
    };

    let sim = d3.forceSimulation(data)
        .force("charge", d3.forceManyBody().strength(0.3))
        //.force("center", d3.forceCenter(w, h/2))
        .force("x", d3.forceX().x(d => d.cx).strength(3.0))
        .force("y", d3.forceY().y(d => d.cy).strength(0.1))
        .force("collision", d3.forceCollide().radius(d => d.radius+1))
        .alpha(0.5)
        .alphaDecay(1 - Math.pow(0.001, 1 / 300)) 
        .on("tick", tick);

    //----------------TOOLTIP----------------------------------

    let f_number = d3.format(",.3r");
    let f_stat = d3.format(fmt);
    let f_assets = d3.format("$,.3s");
    let boxText = function(d) {
        return `<b>${d.radius > 10 ? "" : d.abbr + ": "}${d.union_name}</b><br />` +
            `${stat_label}: <span style="text-decoration: underline">` +
            `${f_stat(stat(d))}</span><br />` +
            `${d.members < 1000 ? d.members : f_number(d.members)} members<br />` +
            `Net assets: ${f_assets(d.net_assets).replace("G", "B")}<br />` +
            `Revenues:  ${f_assets(d.receipts).replace("G", "B")}<br />` +
            `Spending:  ${f_assets(d.disbursements).replace("G", "B")}`;
    };


    nodes.on("mouseover", d => { tooltip.show(); tooltip.html(boxText(d)); })
        .on("mousemove", d => { 
            tooltip.style("top", box_y(event.pageY) + "px")
                .style("left", box_x(event.pageX)+ "px");
        })
        .on("mouseout", tooltip.hide);
    d3.select(window).on("scroll", tooltip.hide);

    //----------------FUNCTIONS----------------------------------
    let reorder = function(new_stat, stat_min=1, new_stat_label="", 
                           new_fmt="$,.2f", show_axis=true, log=true,
                           less_label="", more_label="") {
        stat = new_stat;
        stat_label = new_stat_label;
        fmt = new_fmt;
        f_stat = d3.format(fmt);

        let max = d3.max(intls.filter(d => d.members > 100 && !!stat(d))
                              .map(stat));
        let buf_radius = scales.radius(intls.filter(d => stat(d) == max)[0].members);
        if (log) {
            max *= 1.4 * (w - 2*buffer + buf_radius) / (w - 2*buffer);
        } else {
            max *= (w - 2*buffer + buf_radius) / (w - 2*buffer);
        }
        scales.x = (log ? d3.scaleLog() : d3.scaleLinear())
            .domain([stat_min, max])
            .range([buffer, w - buffer]);

        axis = d3.axisTop(scales.x)
            .ticks(w > 400 ? 12 : 6, fmt)
            .tickSizeOuter(0);
        axis_el.style("visibility", show_axis ? "visible" : "hidden")
            .call(axis);
        d3.selectAll(".axis path, .axis line").attr("stroke", axisColor);
        d3.selectAll(".axis text").attr("fill", axisColor);


        text_less.text(!!less_label ? "← " + less_label : "");
        text_more.text(!!more_label ? more_label + " →" : "");

        let newdata = intls.map(d => {
            d = {...d};
            d.show = d.members > 100 && stat(d) > stat_min;
            d.radius = d.show ? Math.max(1, scales.radius(d.members)) : 0;
            d.color= colors[d.affl];
            d.cy = h/2;
            d.y = d.cy;
            d.cx = scales.x(stat(d));
            d.x = d.cx;
            return d;
        });
        a2_chart.data = newdata;

        add(newdata);

        sim.force("x", d3.forceX().x(d => d.cx).strength(2.0))
            .force("collision", d3.forceCollide().radius(d => d.radius+1))
            .alpha(0.05)
            .alphaDecay(1 - Math.pow(0.001, 1 / 300)) 
            .restart();
    };

    let highlight = function(abbrs, state) {
        nodes.filter(d => abbrs.includes(d.abbr))
            .select("circle")
            .attr("stroke-width", state ? 2 : 0)
            .attr("stroke", "#222");
    };

    return {data, add, reorder, scales, highlight, sim, tick};
}

main();
