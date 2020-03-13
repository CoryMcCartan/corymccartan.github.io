async function main() {
    let resp = await fetch("/data/us-house-2018/output.json");
    let data = await resp.json();
    window.data = data;

    fill_summary(data);
    
    fetch("/data/us-house-2018/history.csv")
        .then(r => r.text())
        .then(data => history(data, $("#history")));

    overview(data, $("#overview"));
    outcomes(data, $("#outcomes"));
    generic(data, $("#generic"));
}

function fill_summary(data) {
    let odds = data.prob / (1 - data.prob);
    let direction = odds > 1 ? "in favor of" : "against";
    if (direction == "against") odds = 1 / odds;

    let [X, Y] = getOddsFraction(odds);

    $(".banner > .text").innerHTML = `
        The Democrats are expected to ${data.gain > 0 ? "gain" : "lose"}
        <b>${Math.round(data.gain)} seats</b>. <br>
        The odds are <b>${X}:${Y} ${direction}</b> them taking control of the House.`;

    let date = new Date(data.time);
    let dateStr = date.toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
    let timeStr =  date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });
    timeStr = timeStr.slice(0, -2) + "T"; // convert PDT to PT
    $(".banner > .updated").innerText = `Last updated ${dateStr} at ${timeStr}.`;
}

window.getOddsFraction = function(odds) {
    let X, Y;

    if (odds < 3) {
        let best = odds;

        for (let y = 8; y >= 1; y--) {
            for (let x = 9; x >= y; x--) {
                let error = Math.abs(x/y - odds);
                if (error <= best) {
                    best = error;
                    X = x;
                    Y = y;
                }
            }
        }
    } else {
        X = Math.round(odds);
        Y = 1;
    }

    return [X, Y];
};

window.$ = s => document.querySelector(s);
window.LOG = function(val) {
    console.log(val);
    return val;
};

main();
