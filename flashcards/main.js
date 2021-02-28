terms = [];
I = 0;

function showNextTerm() {
    if (I === 0) shuffle(terms);
    $("#test").text(terms[I]);
    I = (I + 1) % terms.length;
    console.log(I);
}

$("#go").click(function() {
    terms = $("#terms").val().split("\n");
    $("#input").hide();
    $("#test").show();
    $("html").click(showNextTerm);
});

$("#test").hide();

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}
