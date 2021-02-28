let charts = ["chart_sst", "chart_persist", "chart_over_persist", 
    "chart_matrix"];

let dates = ["January  1", "January  8", "January 15", "January 22", 
    "January 29", "February  5", "February 12", "February 19", "February 26", 
    "March  4", "March 11", "March 18", "March 25", "April  1", "April  8", 
    "April 15", "April 22", "April 29", "May  6", "May 13", "May 20", "May 27", 
    "June  3", "June 10", "June 17", "June 24", "July  1", "July  8", "July 15", 
    "July 22", "July 29", "August  5", "August 12", "August 19", "August 26", 
    "September  2", "September  9", "September 16", "September 23", 
    "September 30", "October  7", "October 14", "October 21", "October 28", 
    "November  4", "November 11", "November 18", "November 25", "December  2", 
    "December  9", "December 16", "December 23", "December 30"];

let stations = [{"city":"atlanta","lat":33.63,"lon":-84.4417},
        {"city":"boston","lat":42.3606,"lon":-71.0106},
        {"city":"chicago","lat":41.995,"lon":-87.9336},
        {"city":"dallas","lat":32.8978,"lon":-97.0189},
        {"city":"des_moines","lat":41.5339,"lon":-93.6531},
        {"city":"detroit","lat":42.4092,"lon":-83.01},
        {"city":"houston","lat":29.6381,"lon":-95.2819},
        {"city":"los_angeles","lat":34.0511,"lon":-118.2353},
        {"city":"miami","lat":25.7906,"lon":-80.3164},
        {"city":"minneapolis","lat":44.8831,"lon":-93.2289},
        {"city":"new_york","lat":40.7789,"lon":-73.9692},
        {"city":"philadelphia","lat":39.8683,"lon":-75.2311},
        {"city":"phoenix","lat":33.4278,"lon":-112.0039},
        {"city":"san_francisco","lat":37.6197,"lon":-122.3647},
        {"city":"seattle","lat":47.4444,"lon":-122.3139},
        {"city":"washington","lat":38.8483,"lon":-77.0342}];

fontSize = innerWidth < 500 ? 11 : 12;

const config = {
    background: null,
    padding: {left: 0, right: 0, top: 4, bottom: 4},
    line: {
        strokeWidth: 3,
    },
    view: {
        stroke: "transparent",
    },
    axis: {
        labelFont: "Overpass",
        titleFont: "Overpass",
        labelFontSize: fontSize,
        titleFontSize: fontSize + 2,
        titleFontWeight: "normal",
        labelColor: "#666666",
        labelSeparation: 24,
        gridColor: "#e0e0e0",
        gridDash: [1, 1],
        gridWidth: 1,
    },
    axisTemporal: {
        grid: false,
    },
    legend: {
        labelFont: "Overpass",
        titleFont: "Overpass",
        titleFontWeight: "normal",
        labelFontSize: fontSize + 1,
        titleFontSize: fontSize + 1,
        offset: 8,
    },
    range: {
        category: ["#888f88", "#3366aa", "#cf33aa", "#ddcf00"],
    },
    title: {
        font: "Overpass",
        anchor: "start",
        offset: 4,
        frame: "group",
        fontSize: fontSize + 6,
    },
};

const opts = {
    actions: false,
    config: config,
};

let $ = s => document.querySelector(s);

let get_data = async function(city) {
    return await vega.loader().load(`data/${city}.csv`)
        .then(async data => {
            return vega.read(data, {type: 'csv', parse: 'auto'})
                .map(d => { d.date = d.date + 24*36e5; return d; });
        });
};

(async function() {
    window.data = {
        seattle: await get_data("seattle"),
    };

    window.views = [];
    for (id of charts) {
        await vegaEmbed(`#${id}`, `${id}.json`, opts)
            .then(res => {
                views.push(res.view);
                res.view.insert("data", data.seattle).run();
                window.dispatchEvent(new Event('resize'));
            })
            .catch(console.warn);
    }

    let city_select = $("select#city");
    city_select.onchange = async function() {
        if (!(this.value in data)) {
            data[this.value] = await get_data(this.value);
        } 
        let newdata = data[this.value];

        for (view of views) {
            let changeset = vega.changeset()
                .remove(() => true)
                .insert(newdata);
            view.change("data", changeset).run();
        }

        let name = newdata[0].city;
        Array.from(document.querySelectorAll("#city-name")).map(el => {
            el.innerHTML = name;
        });
    };

    setTimeout(function() {
        $(".vega-bind label").innerHTML = dates[0];
        let label_update = function() {
            $(".vega-bind label").innerHTML = dates[this.value-1];
        };
        $(".vega-bind input[type=range]").oninput = label_update;
        $(".vega-bind input[type=range]").onchange = label_update;
    }, 100);


    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(res) {
            let {latitude, longitude} = res.coords;
            let min_city, min_val = Infinity;
            for (let s of stations) {
                let dist = Math.hypot(s.lat - latitude, s.lon - longitude);
                if (dist < min_val) {
                    min_city = s.city;
                    min_val = dist;
                }
            }
            city_select.value = min_city;
            city_select.dispatchEvent(new Event("change"));
        });
    }

})();
