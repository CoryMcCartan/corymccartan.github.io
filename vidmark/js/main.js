window.$ = function(x) { return document.querySelector(x); }
window.log = function(x) { $("#log").innerHTML += x + "<br />"; }
window.timeoutId = null;
window.loopStart = -1;
window.loopEnd = -1;
window.marks = [0];
window.markIds = ["mark-1"];

function onYouTubeIframeAPIReady() {
    let cont = $("#video");
    window.w = cont.getBoundingClientRect().width;

    window.player = new YT.Player("player", {
        height: Math.round(w * 9/16),
        width: window.w,
        //videoId: id,
        playerVars: {
            rel: 0,
            fs: 0,
            disablekb: 1,
            controls: 0,
            modestbranding: 1,
            playsinline: 1
        },
        events: {
            "onReady": onPlayerReady,
            "onStateChange": onPlayerChg,
        }
    });
}

function onPlayerReady() {
    let url_text = $("#url-text");
    url_text.addEventListener("keypress", function(e) {
        if (e.key == "Enter") loadPlayer(url_text.value);
    });
    $("#url-go").addEventListener("click", function(e) {
        loadPlayer(url_text.value);
    });

    document.body.addEventListener("keydown", function(e) {
        if (e.key == " ") {
            playPause();
        } else if (e.key == "Shift" || e.key == "m") {
            addMark();
        } else if (e.key == "Backspace" || e.key == "d") {
            delMark();
        } else if (e.key == "l") {
            toggleLoop();
        } else if (e.key == "ArrowLeft") {
            jumpBack();
        } else if (e.key == "ArrowRight") {
            jumpForward();
        }
    });

    let progress = $("#progress");
    progress.addEventListener("click", function(e) {
        let t = e.offsetX / w * window.player.getDuration();
        window.player.seekTo(t, true);
    });
    requestAnimationFrame(updatePbar);

    window.addEventListener("pagehide", function(e) {
        let vd = window.player.getVideoData();
        if ("video_id" in vd) {
            localStorage["vidmark." + vd.video_id] = JSON.stringify({
                marks: window.marks.slice(1),
                duration: window.player.getDuration(),
            });
        }
    });
}

function onPlayerChg(e) {
    if (e.data == -1) { // new video loaded
        document.body.focus();
    } if (e.data == 1) {
        let title = window.player.videoTitle;
        document.title = title;
        $("#pg-title").innerText = title;
    }
}

function updatePbar() {
    let t = window.player.getCurrentTime();
    if (window.loopStart >= 0 && t >= window.loopEnd) {
        t = window.loopStart;
        window.player.seekTo(t, true);
        checkDelay();

        // should pause to let player play loop, AND is currently playing
        if ($("#switch-loop-alt").checked ) {
            if (window.player.isMuted()) {
                window.player.unMute();
            } else {
                window.player.mute();
            }
        }
    }

    let pct = 100 * t / window.player.getDuration();
    $("#pbar").style.width = pct + "%";
    requestAnimationFrame(updatePbar);
}

function loadPlayer(url) {
    let vid_id = ytID(url);
    window.player.loadVideoById(vid_id);

    for (let id of window.markIds.slice(1)) {
        $("#" + id).remove();
    }
    window.marks = [0];
    window.markIds = ["mark-1"];
    
    if ($("#switch-load").checked) {
        let loc_id = "vidmark." + vid_id;
        if (loc_id in localStorage) {
            let obj = JSON.parse(localStorage[loc_id]);
            for (m of obj.marks) {
                addMark(m, obj.duration);
            }
        }
    }
    //log(`Mark ${fmtTime(0)}`);
}

function addMark(t=-1, dur=0) {
    if (t < 0) {
        t = window.player.getCurrentTime();
        dur = window.player.getDuration();
    }
    window.marks.push(t);
    let div_mk = document.createElement("div");
    div_mk.className = "tmark";
    div_mk.style.left = (t / dur) * w + "px";
    div_mk.id = "mark-" + window.marks.length;
    window.markIds.push(div_mk.id);
    $("#progress").appendChild(div_mk);
}
function delMark() {
    let t = window.player.getCurrentTime();
    let diffs = window.marks.map(x => Math.abs(x - t));
    let idx = diffs.indexOf(Math.min(...diffs));
    if (window.marks[idx] == 0) return;
    $("#" + window.markIds[idx]).remove();
    window.marks.splice(idx, 1);
    window.markIds.splice(idx, 1);
}

function jumpForward() {
    let t = window.player.getCurrentTime();
    if (Math.max(...window.marks) <= t) { // nothing ahead
        t = t + 5; // jump 5s ahead
    } else {
        let diffs = window.marks.map(x => x > t + 1.0 ? x - t : Infinity);
        t = window.marks[diffs.indexOf(Math.min(...diffs))];
        checkDelay();
    }
    window.player.seekTo(t, true);
}
function jumpBack() {
    let t = window.player.getCurrentTime();
    let diffs = window.marks.map(x => x < t - 1.0 ? t - x : Infinity);
    t = window.marks[diffs.indexOf(Math.min(...diffs))];
    checkDelay();
    window.player.seekTo(t, true);
}
function checkDelay() {
    if ($("#switch-jump-delay").checked) {
        window.player.pauseVideo();
        clearTimeout(window.timeoutId);
        window.timeoutId = setTimeout(function() {
            window.player.playVideo();
        }, 3000);
    }
}

function toggleLoop() {
    if (window.loopStart >= 0) {
        window.loopStart = -1;
        $("#loop-left").style.width = "0";
        $("#loop-right").style.width = "0";
        window.player.unMute();
    } else {
        let t = window.player.getCurrentTime();
        let marks = [...window.marks, window.player.getDuration()];
        let diffs = marks.map(x => x < t ? t - x : Infinity);
        let t_start = marks[diffs.indexOf(Math.min(...diffs))];
        diffs = marks.map(x => x > t ? x - t : Infinity);
        let t_end = marks[diffs.indexOf(Math.min(...diffs))];

        let pct_l = 100 * t_start / window.player.getDuration();
        let pct_r = 100 * (1 - t_end / window.player.getDuration());
        $("#loop-left").style.width = pct_l + "%";
        $("#loop-right").style.width = pct_r + "%";

        window.loopStart = t_start;
        window.loopEnd = t_end;
    }
}

function fmtTime(t) {
    let min = Math.trunc(t / 60);
    let sec = t - min*60;
    let extra = sec < 10 ? "0" : "";
    return `${min}:${extra}${sec.toFixed(2)}`;
}

function playPause() {
    let state = window.player.playerInfo.playerState;
    if (state == 1 || state == 3) {
        window.player.pauseVideo();
    } else {
        window.player.playVideo();
    }
}

function ytID(url) {
    let id = new URL(url).searchParams.get("v");
    if (id === null) {
        log(`URL ${url} doesn't have a 'v' parameter`);
        throw Error("No 'v' parameter");
    }
    return id;
}
