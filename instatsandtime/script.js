function extractData(content) {
    let variables = {
        1: "Loop",
        2: "Act",
        9: "FakeLoop",
        61: "TimesFished",

        89: "KeyKnife",
        90: "Bondingearrings",
        94: "BombQuest",

        102: "BananaDeath",
        103: "MonsterDeath",
        104: "KingDeath",
        105: "TearsDeath",
        106: "HHMReset",
        107: "SpecialEnd",
        108: "BoulderDeath",
        109: "PineappleDeath",
        110: "Suicide",
        111: "FriendquestResets",

        262: "SifLevel",
        263: "MiraLevel",
        264: "IsaLevel",
        265: "OdileLevel",
        266: "BonnieLevel",

        330: "BarrelCount",
        333: "TriedKillingFriend",
        335: "PillarCount",
        337: "GhostsSeen",
        338: "SilverCoin?",
        339: "CalledLoop",

        349: "HumanQuota",
        350: "BumpIntoTable",
        351: "CountrySaidIt",
        352: "CountryDidntSayIt",
        353: "GotToEnd",
        354: "FoundWeaponAgain",
        388: "TimesFastForwarded",
        396: "LoopFlower",
    }

    let system = {
        "_playtime": "Playtime",
        "_battleCount": "BattleCount",
        "_winCount": "WinCount",
        "_escapeCount": "EscapeCount",
        "_saveCount": "SaveCount",
    }

    try {
        // Decompress the content
        const decompressed = LZString.decompressFromBase64(content);
        if (!decompressed) {
            throw new Error("Failed to decompress content.");
        }

        // Parse the decompressed JSON
        const parsed = JSON.parse(decompressed);
        console.log(parsed);

        let result = {};

        let sys = parsed["system"]
        for (let key in system) {
            result[system[key]] = sys[key];
        }

        const vars = parsed["variables"]["_data"]["@a"];
        for (let key in variables) {
            result[variables[key]] = key < vars.length ? vars[key] : 0;
        }

        const loopConvos = vars[54]["@a"]
        const convoCount = loopConvos.reduce((acc, item) => item === "Seen" ? acc + 1 : acc, 0);
        result["LoopConvos"] = convoCount;

        return result;
    } catch (error) {
        console.error("Error processing the file:", error);
        return { "Err": "Error: Unable to process the file." }
    }
}

function generateHtml(data) {
    let html = `<h1>Your Stats</h1>`;

    let playtime = Math.floor((data.Playtime || 0) / 1000);
    let hours = Math.floor(playtime / 3600);
    let minutes = Math.floor((playtime % 3600) / 60);
    let seconds = playtime % 60;
    let playtimeFormatted = `${hours}h ${minutes}m ${seconds}s`;
    html += `<p>You made it to act ${data.Act} in ${playtimeFormatted}</p>`;

    if (data.Loop > 0) {
        html += `<p>You chose to loop ${data.Loop} times, but Siffrin experienced ${data.FakeLoop} loops!</p>`;
    }

    if (data.TimesFastForwarded > 1000) {
        html += `<p>You zoned out ${data.TimesFastForwarded} times... You really don't care about what your friends say, huh?</p>`;
    } else {
        html += `<p>You zoned out ${data.TimesFastForwarded || 0} times!</p>`;
    }

    if (data.GotToEnd > 0) {
        html += `<p>You got to the end ${data.GotToEnd} times.</p>`;
    }

    let saveComment = "";
    if (data.SaveCount <= 0) {
        saveComment = " WOW!";
    } else if (data.SaveCount > data.Loop) {
        saveComment = " You like playing it safe!";
    }

    html += `<p>You saved the game ${data.SaveCount} times.${saveComment}</p>`;

    html += `<h2>Battles and Deaths</h2>`;

    // One battle isn't counted by the game. Not sure which one.
    const battleCount = data.BattleCount + 1;
    let battleComment = "";
    if (battleCount < data.WinCount + data.EscapeCount) {
        battleComment = " Wait, that doesn't add up...";
    }
    html += `<p>You battled a total of ${battleCount} times! You won ${data.WinCount} and escaped ${data.EscapeCount}.${battleComment}</p>`;

    const deathTypes = [
        { name: 'BananaDeath', label: 'Banana Peels' },
        { name: 'MonsterDeath', label: 'Sadnesses' },
        { name: 'KingDeath', label: 'The King' },
        { name: 'TearsDeath', label: 'Touched Tears' },
        { name: 'HHMReset', label: 'Euphrasie' },
        { name: 'SpecialEnd', label: 'Special Ends' },
        { name: 'FirstTrap', label: 'Squished by Boulder' },
        { name: 'PineappleDeath', label: 'Pineapple Allergy' },
        { name: 'Suicide', label: 'Dagger.' },
        { name: 'FriendquestResets', label: 'Power of friendship' }
    ];

    const deathStats = deathTypes
        .map(type => ({
            name: type.label,
            count: data[type.name],
            comment: getDeathComment(type.name, data[type.name])
        }))
        .filter(death => death.count > 0);

    deathStats.sort((a, b) => b.count - a.count);

    html += `<table><thead><tr><th>Death Type</th><th>Count</th><th></th></tr></thead><tbody>`;
    deathStats.forEach(death => {
        html += `<tr><td>${death.name}</td><td>${death.count}</td><td>${death.comment}</td></tr>`;
    });
    html += `</tbody></table>`;

    html += `<h2>Quests and Stats</h2>`;

    html += `<p><img src="siffrin.png" alt="Siffrin"> Lvl ${data.SifLevel} <img src="mira.png" alt="Mirabelle"> Lvl ${data.MiraLevel} <img src="isa.png" alt="Isabeau"> Lvl ${data.IsaLevel} <img src="odile.png" alt="Odile"> Lvl ${data.OdileLevel} <img src="bonnie.png" alt="Bonnie"> Lvl ${data.BonnieLevel}\n</p>`;

    const stats = [
        { label: `You had ${data.LoopConvos} unique conversations with loop.`, value: data.LoopConvos },
        { label: `You called Loop ${data.CalledLoop} times.`, value: data.CalledLoop },
        { label: `You checked ${data.BarrelCount} Barrels.`, value: data.BarrelCount },
        { label: `You inspected ${data.PillarCount} Pillars.`, value: data.PillarCount },
        { label: `You fished ${data.TimesFished} times.`, value: data.TimesFished },
        { label: `You saw ${data.GhostsSeen} ghosts.`, value: data.GhostsSeen },
        { label: `You picked up the KeyKnife ${data.FoundWeaponAgain} times.`, value: data.FoundWeaponAgain },
        { label: `You sharpened the KeyKnife ${data.KeyKnife} times.`, value: data.KeyKnife },
        { label: `You bumped into a table ${data.BumpIntoTable} times.`, value: data.BumpIntoTable },
        { label: `You got ${data.HumanQuota} human quota.`, value: data.HumanQuota },
        { label: `You gifted loop a flower ${data.LoopFlower} times.`, value: data.LoopFlower },
        { label: `You tried to say the name of the country ${data.CountrySaidIt || 0} times, and refused ${data.CountryDidntSayIt || 0} times.`, value: (data.CountrySaidIt || 0) + (data.CountryDidntSayIt || 0) }
    ];

    stats.forEach(stat => {
        if (stat.value > 0) {
            html += `<p>${stat.label}</p>`;
        }
    });

    html = html.replace(/\b\d+\b/g, '<span style="color: cyan;"><b>$&</b></span>');
    html = html.replace(/<\/p>\s*<p>/g, '\n');

    return html;
}

function getDeathComment(deathType, count) {
    switch (deathType) {
        case "BananaDeath":
            if (count >= 50) {
                return "It's too convenient..";
            } else if (count >= 10) {
                return "Truly a dangerous forbidden fruit.";
            } else if (count == 1) {
                return "You preferred eating it.";
            }
            return "";
        case "MonsterDeath":
            if (count >= 10) return "How??";
            if (count >= 5) return "(You feel   cold.)";
            return "";
        case "KingDeath":
            if (count >= 10) return "You make sure to loop back before anything happens to anyone."
            return "";
        case "TearsDeath":
            if (count >= 15) return "You died from touching a tear.";
            if (count >= 5) return "Maybe stop touching those tears?"
            return "";
        case "HHMReset":
            if (count >= 10) return "Something's broken, failing, rotting."
            return "";
        case "SpecialEnd":
            if (count >= 15) return "Please tell me what you did to get this so many times.";
            if (count >= 5) return "Honestly got no idea what this is.";
            return "";
        case "FirstTrap":
            if (count >= 15) return "You're stupid and forgetful.";
            if (count >= 5) return "You got crushed.";
        case "PineappleDeath":
            if (count >= 20) return "You're hungry, still.";
            if (count >= 5) return "But it's so tasty..";
            if (count == 1) return "You're allergic to pineapples.";
            return "";
        case "Suicide":
            if (count >= 20) return "Back to the stage.";
            if (count >= 5) return "You saved yourself some time.";
            if (count == 1) return "Once was enough.";
            return "";
        case "FriendquestResets":
            if (count >= 6) return "Again, " + "again, ".repeat(count - 5) + "again!";
            if (count >= 3) return "Again, again, again!";
            if (count == 1) return "In this moment, you were loved";
        default:
            return "";
    }
}

document.getElementById("fileInput").addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        const output = document.getElementById("output");
        const data = extractData(content);
        output.innerHTML = generateHtml(data);
        output.style.display = "block";
    };

    reader.onerror = function () {
        alert("Failed to read the file. Please try again.");
    };

    reader.readAsText(file);
});

function resetFileInput() {
    document.getElementById('fileInput').value = ''; // Reset the file input
    document.getElementById('fileInput').click();    // Trigger the file dialog
}