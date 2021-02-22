function chart_histogram(data, id) {
    let container = d3.select(id);
    const h = bigScreen ? 250 : 170;
    const w = container.node().getBoundingClientRect().width;
    const gap = 45;
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
        .style("top", bigScreen ? "1em" : "0.5em")
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

