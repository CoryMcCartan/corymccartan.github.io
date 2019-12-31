
async function load_data() {
    window.intls = await d3.csv("/data/unions/internationals_2018.csv", d3.autoType);
}

async function main() {
    await load_data();

    let intl_container = d3.select("#intl-chart");
    window.w = d3.select("main").node().getBoundingClientRect().width;
    window.h = innerHeight - d3.select("header").node().getBoundingClientRect().height;

    //makeIntlBubbles(intl_container, "net_assets", 12, 16);
    window.intl_chart = makeIntlBubbles(intl_container);

    let walmart_dod = [{
        abbr: "Walmart",
        radius: intl_chart.scales.radius(2.2e6), 
        color: "#666", cx: w/2, cy: h/2, 
    }, {
        abbr: "DoD",
        radius: intl_chart.scales.radius(3.2e6), 
        color: "#666", cx: w/2, cy: h/2, 
    }];

    let a1s10_unions = ["NEA", "AFT", "SEIU", "IBT", "UFCW", "AFSCME", "RWAW"];
    let a1s40_unions = ["UAW", "USW", "CJA", "IBEW"];

    let controller = new ScrollMagic.Controller();
    controller.addScene([
        new ScrollMagic.Scene({
            triggerElement: "#what-does-big-mean-anyway",
            triggerHook: 1,
            duration: "400%",
        })
        .on("enter", () => intl_chart.rescale("members")),

        new ScrollMagic.Scene({
            triggerElement: intl_container.node(),
            triggerHook: 1,
            offset: h,
            duration: "545%",
        })
        .setPin(intl_container.node(), { pushFollowers: false }),

        new ScrollMagic.Scene({
            triggerElement: "#a1s20",
            triggerHook: 0.95,
            duration: "90%",
        })
        .on("enter", () => intl_chart.highlight(a1s10_unions, true))
        .on("leave", () => intl_chart.highlight(a1s10_unions, false)),

        new ScrollMagic.Scene({
            triggerElement: "#a1s30",
            triggerHook: 0.7,
            duration: "70%",
        })
        .on("enter", () => {
            intl_chart.data.push(walmart_dod[0]);
            intl_chart.data.push(walmart_dod[1]);
            intl_chart.add(intl_chart.data, 0.12);
        })
        .on("leave", () => {
            intl_chart.data.pop();
            intl_chart.data.pop();
            intl_chart.add(intl_chart.data, 0.1);
        }),

        new ScrollMagic.Scene({
            triggerElement: "#a1s40",
            triggerHook: 0.8,
            duration: "200%",
        })
        .on("enter", () => {
            intl_chart.rescale("net_assets", 5, 15);
            intl_chart.highlight(a1s40_unions, true);
        })
        .on("leave", () => intl_chart.highlight(a1s40_unions, false)),

        new ScrollMagic.Scene({
            triggerElement: "#a1s50",
            triggerHook: 0.7,
            duration: "70%",
        })
        .on("enter", () => {
            intl_chart.data.push({
                abbr: "BRK",
                radius: intl_chart.scales.radius(348.7e9), 
                //radius: intl_chart.scales.radius(2e9), 
                color: "#666", cx: w/2, cy: h/2, 
            });
            intl_chart.add(intl_chart.data, 0.05);
        })
        .on("leave", () => {
            intl_chart.data.pop();
            intl_chart.add(intl_chart.data, 0.5);
        }),
    ]);

}

window.palette = ["#5fb0e6", "#73bc5e", "#eebc3b", "#8c54b0", "#4c6060"];

function makeIntlBubbles(container, radius="members", r_scale=10, r_div=11) {
    let svg = container.append("svg");
    svg.attr("width", w)
        .attr("height", h);

    let scales = {
        radius: d3.scalePow()
            .exponent(0.5)
            .domain(d3.extent(intls.map(d => d[radius])))
            .range([4, r_scale + w/r_div])
    };
    let colors = {"AFL-CIO": palette[0], "CTW": palette[1], "INDEP": palette[2]};
    let centers = {
        "AFL-CIO": [w*0.3, h*0.2],
        "CTW": [w*0.5, h*0.7],
        "INDEP": [w*0.6, h*0.45],
    };

    let data = intls.filter(d => d.members > 50)
    .map(d => {
        d.radius= scales.radius(d[radius]);
        d.cy = centers[d.affl][1];
        d.color= colors[d.affl];
        d.cx = centers[d.affl][0];
        d.tooltip = d.union_name
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

    let nodes = svg.selectAll("g.intl");
    let bubbles = svg.selectAll("g.intl circle");
    let labels = svg.selectAll("g.intl text");
    window.nodes=nodes;
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
            //.attr("font-size", d => 3*d.radius / (d.abbr.length+2))
            .attr("font-size", d => {
                if (!d.abbr) console.log(d);
                return 3*d.radius / (d.abbr.length+2)
            })
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
        .force("x", d3.forceX().x(d => d.cx).strength(0.1))
        .force("y", d3.forceY().y(d => d.cy).strength(50))
        .force("y", d3.forceY().y(0))
        .force("collision", d3.forceCollide().radius(d => d.radius+1))
        .alpha(0.2)
        .alphaDecay(1 - Math.pow(0.001, 1 / 600)) 
        .on("tick", tick);
    window.sim=sim;

    //----------------TOOLTIP----------------------------------
    let tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("width", "180px")
        .html("testing...");

    let f_members = d3.format(",.4r");
    let f_assets = d3.format("$,.3s");
    let boxText = function(d) {
        return `<b>${d.tooltip}</b><br />` +
            `${d.members < 1000 ? d.members : f_members(d.members)} members<br />` +
            `${d.locals} private or federal locals<br />` +
            `Net assets: ${f_assets(d.net_assets).replace("G", "B")}<br />` +
            `Revenues:  ${f_assets(d.receipts).replace("G", "B")}<br />` +
            `Spending:  ${f_assets(d.disbursements).replace("G", "B")}<br />` +
            `${d.officers} officers and ${d.staff} staff`;
    };
    let box_x = (x, w) => x - pageXOffset > innerWidth - 180 ? x - 192 : x + 16;
    let box_y = (y, h) => y - pageYOffset > innerHeight - 140 ? y - 120 : y - 16;
    tooltip.show = () => tooltip.style("visibility", "visible");

    tooltip.hide = () => tooltip.style("visibility", "hidden");
    tooltip.hide();

    nodes.on("mouseover", d => { tooltip.show(); tooltip.html(boxText(d)); })
        .on("mousemove", d => { 
            tooltip.style("top", box_y(event.pageY) + "px")
                .style("left", box_x(event.pageX)+ "px");
        })
        .on("mouseout", tooltip.hide);
    d3.select(window).on("scroll", tooltip.hide);

    //----------------FUNCTIONS----------------------------------
    let rescale = function(radius, r_scale=10, r_div=11) { 
        scales.radius = d3.scalePow()
            .exponent(0.5)
            .domain(d3.extent(intls.map(d => d[radius])))
            .range([4, r_scale + w/r_div]);
        data = data.map(d => {
            d.radius = scales.radius(d[radius]);
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

    return {data, rescale, add, scales, highlight};
}

main()
