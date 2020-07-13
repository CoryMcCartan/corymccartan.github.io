const TESTING = false; 

function main() {
    $("#go").addEventListener("click", process);
    $("#text").focus();

    if (TESTING) loadText();
}

function process() {
    $("#go").remove();

    let el = $("#text");
    let text = el.innerText;
    el.innerHTML = null;
    el.contentEditable = false;

    // handle quotation marks that end a sentence
    text = text.replace(/[.?!]["”]/g, "”.");
    // any series of new lines is a paragraph break.  let paragraphs = text.replace(/\n+/g, "\n").split("\n");
    let paragraphs = text.replace(/\n+/g, "\n").split("\n");
    // pull out sentences from each paragraph
    let data = paragraphs.map(p => nlp(p).sentences().data()
                              .map(s => s.text.trim())); 
    data = data.filter(p => p.length > 0); // delete empty paragraphs

    let color = d3.scaleLinear()
        .domain([1, 25, 35, 50])
        .range(["#cfd", "#ddd", "#ffa", "#f87"]);

    let output = d3.select(el);

    paragraphs = output.selectAll("p")
        .data(data)
        .enter()
        .append("p");
    
    let wordCount = text => text.replace(/\s/g, " ").split(" ").length;
    let sentences = paragraphs.selectAll("div.sentence")
        .data(p => p)
        .enter()
        .append("div")
        .attr("class", "sentence")
        .classed("passive", s => isPassive(s))
        .classed("long", s => wordCount(s) >= 40)
        .html(wrap)
        .append("span")
        .attr("class", "word-count")
        .text(s => wordCount(s))
        .style("background-color", s => color(wordCount(s)));

    $("#stats").innerText = `${$$("p").length} paragraphs, ${$$(".sentence").length} sentences, ` + 
        `${wordCount(text)} words.`;
}

function isPassive(s) {
    // get rid of punctuation
    let stripped = s.replace(/[—–]/g, ' ').replace(/[^a-zA-Z ]/g, "");

    // replace irregular past participles with 'regularized' forms
    stripped = stripped.replace(/brought/g, "bringed")
        .replace(/cost/, "costed")
        .replace(/given/, "gaved")
        .replace(/begun/, "begined")
        .replace(/built/, "builded")
        .replace(/caught/, "catched")
        .replace(/chosen/, "choosed")
        .replace(/cut/, "cutted")
        .replace(/come/, "comed")
        .replace(/ had/, " haved")
        .replace(/gone/, "goed")
        .replace(/lent/, "lended")
        .replace(/ run/, " runned")
        .replace(/read/, "readed")
        .replace(/sent/, "sended")
        .replace(/sung/, "sanged")
        .replace(/drawn/, "drawed")
        .replace(/felt/, "feeled")
        .replace(/gotten/, "getted")
        .replace(/taught/, "teached")
        .replace(/stood/, "standed")
        .replace(/written/, "writed")
        .replace(/bought/, "buyed")
        .replace(/get done/, "finished")
        .replace(/left/, "leaved")
        .replace(/made/, "maked")
        .replace(/paid/, "payed")
        .replace(/said/, "sayed")
        .replace(/shown/, "showed")
        .replace(/taken/, "taked")
        .replace(/told/, "telled");

    return / (will be|has been|is|are|was|were)( \w+ly)?( not)? \w+ed /.test(stripped);
}

function wrap(sentence) {
    let parsed = nlp(sentence);
    let adverbs = parsed.adverbs().data().map(w => w.normal);
    let adjectives = parsed.adjectives().data().map(w => w.normal);
    let flagWords = [
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
    ];

    // remove duplicates
    adverbs = Array.from(new Set(adverbs));
    adjectives = Array.from(new Set(adjectives));

    for (let adverb of adverbs) {
        let pattern = new RegExp("(\\W|^)(" + adverb + ")(\\W)", "gi");
        sentence = sentence.replace(pattern, "$1<span class='highlight adverb'>$2</span>$3");
    }

    for (let adjective of adjectives) {
        let pattern = new RegExp("(\\W|^)(" + adjective + ")(\\W)", "gi");
        sentence = sentence.replace(pattern, "$1<span class='highlight adjective'>$2</span>$3");
    }

    for (let word of flagWords) {
        let pattern = new RegExp("(\\W|^)(" + word + ")(\\W)", "gi");
        sentence = sentence.replace(pattern, "$1<span class='highlight flag'>$2</span>$3");
    }

    return sentence;
}

async function loadText() {
    let response = await fetch("assets/paper.txt");
    let text = await response.text();

    $("#text").innerText = text;

    process();
}
