async function main() {
    let data = await d3.json("standings.json");

    let timestamp = d3.timeFormat("%-I %p %A, %B %-d")(new Date(data.standings_date));
    d3.select("#time").text("Standings current as of " + timestamp);
    let teams = data.standing;

    let divisions = [["AL", "W"], ["AL", "C"], ["AL", "E"], 
                     ["NL", "W"], ["NL", "C"], ["NL", "E"]];
    let regions = {W: "West", C: "Central", E: "East"};
    let columns = ["Won", "Lost", "Pct.", "GB", "L10", "Stk.", "Home", "Away"]

    for (d of divisions) {
        let table = d3.select(`#${d[0]}-${d[1]}`);
        let d_teams = teams.filter(t => t.conference === d[0] && t.division === d[1]);

        let thead = table.append("thead");
        let tbody = table.append("tbody");

        thead.append("tr")
            .selectAll("th")
            .data([regions[d[1]].toUpperCase()].concat(columns)).enter()
            .append("th")
            .text(c => c);

        let rows = tbody.selectAll("tr")
            .data(d_teams)
            .enter()
            .append("tr")
            .classed("home", t => t.last_name == "Mariners");

        rows.selectAll("td")
            .data(r => [
                r.first_name,
                r.won,
                r.lost,
                r.win_percentage,
                r.games_back === 0 ? "—" : r.games_back,
                r.last_ten.replace("-", "–"),
                r.streak,
                r.home_won + "–" + r.home_lost,
                r.away_won + "–" + r.away_lost,
            ]).enter()
            .append("td")
            .text(c => c);
    }

}

window.addEventListener("load", main);
