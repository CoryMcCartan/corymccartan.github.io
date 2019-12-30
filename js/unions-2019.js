
async function load_data() {
    window.intls = await d3.csv("/data/unions/internationals_2018.csv", d3.autoType);
}

async function main() {
    await load_data();

    let intl_container = d3.select("#intl-chart");
    //makeIntlBubbles(intl_container, "net_assets", 12, 16);
    makeIntlBubbles(intl_container);
}

window.palette = ["#5fb0e6", "#73bc5e", "#eebc3b", "#8c54b0", "#4c6060"];

function makeIntlBubbles(container, radius="members", r_scale=20, r_div=12) {
    let svg = container.append("svg");
    let w = container.node().getBoundingClientRect().width;
    let h = 60 + w * 0.8;
    svg.attr("width", w)
        .attr("height", h);

    let radiusScale = d3.scalePow()
        .exponent(0.5)
        .domain(d3.extent(intls.map(d => d[radius])))
        .range([4, r_scale + w/r_div]);
    let colors = {"AFL-CIO": palette[0], "CTW": palette[1], "INDEP": palette[2]};
    let centers = {
        "AFL-CIO": [w*0.4, h*0.4],
        "CTW": [w*0.6, h*0.5],
        "INDEP": [w*0.5, h*0.6],
    };

    let data = intls.filter(d => d.members > 50)
    .map(d => ({
        members: d.members,
        net_assets: d.net_assets,
        radius: radiusScale(d[radius]),
        color: colors[d.affl],
        label: d.abbr,
        cx: centers[d.affl][0],
        cy: centers[d.affl][1],
        tooltip: d.union_name
            .replace(", AFL-CIO", "")
            .replace(", AFLCIO", "")
            .replace(" AFL-CIO", "")
            .replace(" AFLCIO", "")
            .replace(", IND", "")
            .replace(" IND", "")
            .replace(" WKRS", " WORKERS")
            .replace(" EMPLS", " EMPLOYEES")
            .replace(" ASN", " ASSOCIATION")
            .replace(" DEPT", " DEPARTMENT")
    }));

    let nodes = svg.selectAll("g.intl")
        .data(data)
        .enter().append("g")
        .attr("class", "intl");

    let bubbles = nodes.append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => d.color)

    let labels = nodes.append("text")
        .text(d => d.radius > 10 ? d.label : "")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", d => 3*d.radius / (d.label.length+2))
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .attr("x", 0)
        .attr("y", d => d.radius*0.04);

    let bubble_tick = function() {
        nodes.attr("transform", d => `translate(${d.x}, ${d.y})`);
    }

    let sim = d3.forceSimulation(data)
        .force("charge", d3.forceManyBody().strength(2))
        .force("center", d3.forceCenter(w/2, h/2))
        .force("x", d3.forceX().x(d => d.cx))
        .force("y", d3.forceY().y(d => d.cy))
        .force("collision", d3.forceCollide().radius(d => d.radius+1))
        .on("tick", bubble_tick);

    let rescale = function(w) { };

    let tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("width", "150px")
        .html("testing...");

    let f_members = d3.format(",.4r");
    let f_assets = d3.format("$,.3s");
    let boxText = function(d) {
        return `<b>${d.tooltip}</b><br />` +
            `${d.members < 1000 ? d.members : f_members(d.members)} members<br />` +
            `Net assets: ${f_assets(d.net_assets).replace("G", "B")}`;
    };
    let box_x = (x, w) => x - pageXOffset > innerWidth - 150 ? x - 158 : x + 16;
    let box_y = (y, h) => y - pageYOffset > innerHeight - 80 ? y - 72 : y - 16;

    tooltip.show = () => tooltip.style("visibility", "visible");
    tooltip.hide = () => tooltip.style("visibility", "hidden");
    tooltip.hide();

    nodes.on("mouseover", d => { tooltip.show(); tooltip.html(boxText(d)); })
        .on("mousemove", d => { 
            tooltip.style("top", box_y(event.pageY) + "px")
                .style("left", box_x(event.pageX)+ "px");
        })
        .on("mouseout", tooltip.hide);
}

main()
