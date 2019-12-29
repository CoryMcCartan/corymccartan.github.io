window.overall = 0.5;

async function load_data() {
    let data = await d3.csv("/data/electability_ests_swing.csv", d3.autoType)
    window.keep_states = ["NH", "VA", "MI", "WI", "PA", "OH", 
                          "IA", "NM", "NV", "FL"];
    data = data
        .filter(d => keep_states.includes(d.state));
    window.data = data;
}

async function main() {
    await load_data();

    let bar_container = d3.select("#bar-chart");
    let line_container = d3.select("#line-chart");
    window.candidates = ["Biden", "Sanders", "Warren", "Buttigieg", "Harris"];

    plots = candidates.map((c, i) => makeBarChart(bar_container, c, i));
    lines = makeLineChart(line_container);

    d3.select(window).on("resize", () => {
        let sp_avail = bar_container.node().getBoundingClientRect().width;
        let poss_w = [1,2,3,5]
            .map(n => sp_avail/n)
            .filter(w => w > min_w);
        if (poss_w.length == 0) poss_w = [sp_avail];
        let w = Math.min(...poss_w) - margin_b.l - margin_b.r;
        let n = Math.max(Math.floor(sp_avail / w), 1);

        plots.forEach(p => p.rescale(w, n))
		
        w = line_container.node().getBoundingClientRect().width - 
            margin_l.l - margin_l.r;
		lines.rescale(w);
    })
}

window.min_w = 220;
window.h = 150;
window.margin_b = {l: 27, r: 5, t: 30, b: 20};
window.margin_l = {l: 30, r: 15, t: 30, b: 20};
window.red = "#d03230";
window.blue = "#2070c0"; 
window.palette = ["#5fb0e6", "#73bc5e", "#eebc3b", "#8c54b0", "#4c6060"];

function makeLineChart(container) {
    let svg = container.append("svg");
    let plot = svg.append("g")
        .attr("transform", `translate(${margin_l.l}, ${margin_l.t})`);

	let x = d3.scaleLinear()
		.domain([0.47, 0.53]);
	let y = d3.scaleLinear()
		.domain(d3.extent(data, d => d.total_ev));

    plot.append("g").attr("class", "x axis");
    plot.append("g").attr("class", "y axis");

    let h_refline = plot.append("line")
        .attr("class", "ref_line")
        .attr("stroke-width", 2)
        .attr("stroke", "#000000");

    let data_c = candidates.map(c => 
        data.filter(d => d.candidate == c && d.state == "IA")
            .map(d => { d.i = candidates.indexOf(d.candidate); return d}));

    var cand_lines = plot.append("g");
    let cands = cand_lines.selectAll("path")
        .data(data_c)
        .enter().append("path")
        .attr("stroke", d => palette[d[1].i])
        .attr("fill", "none")
        .attr("stroke-width", 2);

    let v_slider = plot.append("g");
    let v_line = v_slider.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("stroke-width", 1)
        .attr("stroke", "#777777");
    let v_label = v_slider.append("g").selectAll("text")
        .data(data_c.map(d => d[1]))
        .enter().append("text")
        .attr("alignment-baseline", "hanging")
        .attr("fill", d => palette[d.i])
        .style("font-size", "12px")
        .style("font-family", "'Josefin Sans', 'Futura', sans-serif");
    let v_points = v_slider.append("g").selectAll("circle")
        .data(data_c.map(d => d[1]))
        .enter().append("circle")
        .attr("fill", d => palette[d.i])
        .attr("r", 3)
        .attr("cx", 0);

    dem_text = d3.select("#text_dem")
        .style("color", blue);
    gop_text = d3.select("#text_gop")
        .style("color", red);
    let hint = d3.select("#hint");
    let drag = d3.drag()
        .on("drag", function(d) {
            overall = +(x.invert(d3.event.x).toFixed(3))
            overall = Math.min(Math.max(overall, 0.47), 0.53);
            dem_text.text(`${d3.format(".1%")(overall)} Democratic`);
            gop_text.text(`${d3.format(".1%")(1-overall)} Republican`);
            plots.forEach(p => p.update(overall));
            hint.style("visibility", "hidden");
            lines.update(overall);
        });

    let v_handle = plot.append("rect")
        .attr("class", "handle")
        .attr("y", 0)
        .attr("x", 0)
        .attr("opacity", 0.0)
        .attr("fill", "#ff0000")
        .call(drag);

	let rescale = function(w) {
		let h = w > 420 ? w*0.7 : w*1.379;

        svg
            .attr("width", w + margin_l.l + margin_l.r)
            .attr("height", h + margin_l.t + margin_l.b);
        plot
            .attr("width", w)
            .attr("height", h);

        x.range([0, w]);
        y.range([h, 0]);

        let xAxis = d3.axisBottom(x)
            .ticks(7)
            .tickFormat(d3.format(".0%"));
        let yAxis = d3.axisLeft(y);
        plot.select(".x.axis")
            .call(xAxis)
            .attr("transform", `translate(0, ${h})`);
        plot.select(".y.axis").call(yAxis);

        h_refline
            .attr("x1", 0)
            .attr("x2", w)
            .attr("y1", y(270))
            .attr("y2", y(270));

        v_line.attr("y2", h);
	    v_handle
	        .attr("width", w)
	        .attr("height", h);

        let line = d3.line()
            .x(d => x(d.overall))
            .y(d => y(d.total_ev));

        cands.attr("d", d => line(d))

        update(overall);
	};

	let update = function(overall) {
        let h = plot.attr("height");

	    v_slider.attr("transform", `translate(${x(overall)}, 0)`);
        
        d_new = data_c.map(d => 
            d.filter(r => Math.abs(r.overall - overall) < 0.0001)[0])
        v_label
            .data(d_new)
            .text(d => `${d.candidate}: ${d.total_ev} EV${d.total_ev >= 270 ? ' ✓' : ''}`)
            .attr("text-anchor", overall < 0.506 ? "start" : "end")
            .attr("x", overall < 0.506 ? 2 : -2)
            .attr("y", d => overall < 0.506 ? d.i*15 : h - (5-d.i)*15);
        v_points
            .data(d_new)
            .attr("cy", d => y(d.total_ev))
	};

    let w = container.node().getBoundingClientRect().width - margin_l.l - margin_l.r;
	rescale(w);
	return({rescale, update});
}

function makeBarChart(container, lname, i) {
    let svg = container.append("svg").attr("data-cand", lname);
    let title_box = svg.append("rect")
        .attr("x", margin_b.l)
        .attr("y", 0)
        .attr("height", 3)
        .attr("fill", palette[i]);
    let title = svg.append("text")
        .attr("class", "facet title")
        .text(lname)
		.attr("y", 9)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "hanging");

    let plot = svg.append("g")
        .attr("transform", `translate(${margin_b.l}, ${margin_b.t})`);

    let x = d3.scaleLinear()
        .domain([0.43, 0.57]);
    let y = d3.scaleBand()
        .padding(0.2)
        .domain(keep_states);

    plot.append("g").attr("class", "x axis");
    plot.append("g").attr("class", "y axis");

    let bars = plot.append("g");

    let v_refline = plot.append("line")
        .attr("class", "ref_line")
        .attr("stroke-width", 1.5)
        .attr("stroke", "#000000");

    let ev_text = plot.append("text")
        .attr("class", "ev title")
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "bottom");

    let rescale = function(w, n) {
        svg
            .attr("width", w + margin_b.l + margin_b.r)
            .attr("height", h + margin_b.t + margin_b.b);
        plot
            .attr("width", w)
            .attr("height", h);

		title_box.attr("width", w);
        title.attr("x", margin_b.l + w/2);
        ev_text
            .attr("x", w)
            .attr("y", h-5);

        x.range([0, w]);
        y.range([0, h]);

        let x_idx;
        switch (n) {
            case 1: x_idx = [4]; break;
            case 2: x_idx = [3,4]; break;
            case 3: x_idx = [2,3,4]; break;
            case 5: x_idx = [0,1,2,3,4]; break;
        }

        let xAxis = d3.axisBottom(x)
            .ticks(8)
            .tickFormat(d3.format(".0%"));
        let yAxis = d3.axisLeft(y);
        plot.select(".x.axis")
            .call(xAxis)
            .attr("transform", `translate(0, ${h})`)
            .style("opacity", x_idx.includes(i) ? 1 : 0);
        plot.select(".y.axis")
            .call(yAxis)
            .style("opacity", i % n == 0 ? 1 : 0);

        update(overall);
    }

    let data_c = data.filter(r => r.candidate == lname);
    let last_overall = 0.5;
    let dt = data_c.filter(r => Math.abs(r.overall - last_overall) < 0.0001);
    let update = function(overall) {
        if (overall != last_overall) {
            dt = data_c.filter(r => Math.abs(r.overall - overall) < 0.0001);
            last_overall = overall;
        }

        v_refline
            .attr("x1", x(0.5))
            .attr("x2", x(0.5))
            .attr("y1", 0)
            .attr("y2", h);

        ev_text
            .text(`${dt[1].total_ev} EV`)
            .attr("fill", dt[1].total_ev >= 270 ? blue: red);

        bars.selectAll(".bar")
            .data(dt)
            .join("rect")
            .attr("class", "bar")
            .attr("x", d => 0)
            .attr("y", d => y(d.state))
            .attr("fill", d => d.dem_pct >= 0.5 ? blue : red)
            .attr("width", d => x(d.dem_pct))
            .attr("height", d => y.bandwidth());
    }


    let sp_avail = container.node().getBoundingClientRect().width;
    let poss_w = [1,2,3,5]
        .map(n => sp_avail/n)
        .filter(w => w > min_w);
    if (poss_w.length == 0) poss_w = [sp_avail];
    let init_w = Math.min(...poss_w) - margin_b.l - margin_b.r;
    let init_n = Math.max(Math.floor(sp_avail / init_w), 1);
    rescale(init_w, init_n);

    return {rescale, update};
}


main();
