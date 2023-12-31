/*
global log state on getObj _ findObjs playerIsGM sendChat
---CLOUD9 ERROR CLEARING---
*/
// By: DXWarlock
//Script: Aura/Tint HealthColor
//Roll20 Thread: https://app.roll20.net/forum/post/2139713/script-aura-slash-tint-healthcolor#post-2139713
//Roll20 Contact: https://app.roll20.net/users/262130
var HealthColors = HealthColors || (function() {
    'use strict';
    var version = '0.9.2.1',
        lastUpdate = 1444174668,
        schemaVersion = '0.9.2.1',
        observers = {
            turnOrderChange: []
        },
        observeTurnOrderChange = function(handler) {
            if(handler && _.isFunction(handler)) {
                observers.turnOrderChange.push(handler);
            }
        },
        notifyObservers = function(event) {
            _.each(observers[event], function(handler) {
                handler();
            });
        },
        /*
        TOKEN CHANGE
        */
        handleToken = function(obj) {
            var bar = state.auraBar;
            var tint = state.auraTint;
            var onPerc = state.auraPerc;
            var ColorOn = state.auraColorOn;
            var dead = state.auraDead;
            var markerColor = "";
            if(obj.get("represents") !== "") {
                if(ColorOn !== true) return; //Check Toggle
                //Monster or Player
                var oCharacter = getObj('character', obj.get("_represents"));
                var type = (oCharacter.get("controlledby") === "" || oCharacter.get("controlledby") === "all") ? 'Monster' : 'Player';
                //Check bars
                if(obj.get(bar + "_max") === "" && obj.get(bar + "_value" && bar != 'bar4') === "") return;
                var maxValue;
                var curValue;
                if (bar == 'bar4') {
                    log("Checking bar values...");
                    if(type == 'Player') {
                        var bar1Max = parseInt(obj.get("bar1_max"), 10);
                        var bar2Max = parseInt(obj.get("bar2_max"), 10) || 0;
                        log("Player: bar1Max = "+bar1Max+" : bar2Max ="+bar2Max);
                        maxValue = bar1Max+bar2Max;
                        var bar1Value = parseInt(obj.get("bar1_value"), 10);
                        var bar2Value = parseInt(obj.get("bar2_value"), 10) || 0;
                        log("Player: bar1Value = "+bar1Value+" : bar2Value ="+bar2Value);
                        curValue = bar1Value+bar2Value;
                        log("Player: maxValue = "+maxValue+" : curValue ="+curValue);
                    } else {
                        maxValue = parseInt(obj.get("bar1_max"), 10);
                        curValue = parseInt(obj.get("bar1_value"), 10);
                        log("NPC: maxValue = "+maxValue+" : curValue ="+curValue);
                    }
                } else {
                    maxValue = parseInt(obj.get(bar + "_max"), 10);
                    curValue = parseInt(obj.get(bar + "_value"), 10);
                }
                if(isNaN(maxValue) && isNaN(curValue)) return;
                //Calc percentage
                var percReal = Math.round((curValue / maxValue) * 100);
                var perc = Math.round((curValue / maxValue) * 120);
                //Set dead
                if(curValue <= 0 && dead === true) {
                    obj.set("status_dead", true);
                    if(state.auraDeadFX !== "None") PlayDeath(state.auraDeadFX);
                } else if(dead === true) obj.set("status_dead", false);
                //SET PLAYER AURA------------
                if(type == 'Player') {
                    if(state.PCAura === false) return;
                    if(percReal > onPerc) {
                        SetAuraNone(obj);
                        return;
                    }
                    markerColor = newColor(perc);
                    var cBy = oCharacter.get('controlledby');
                    if(tint === true) obj.set({
                        'tint_color': markerColor,
                    });
                    else if(cBy.split(',').length == 1) {
                        var player = getObj('player', cBy);
                        var pColor = player.get('color');
                        pcSet(obj, state.AuraSize, markerColor, pColor);
                    } else {
                        npcSet(obj, state.AuraSize, markerColor);
                    }
                }
                //SET NPC AURA------------
                if(type == 'Monster') {
                    if(state.NPCAura === false) return;
                    if(percReal > onPerc) {
                        SetAuraNone(obj);
                        return;
                    }
                    markerColor = newColor(perc);
                    if(tint === true) obj.set({
                        'tint_color': markerColor,
                    });
                    else {
                        npcSet(obj, state.AuraSize, markerColor);
                    }
                }
            }
        },
        /*
        CHAT MESSAGE
        */
        handleInput = function(msg) {
            var msgFormula = msg.content.split(/\s+/);
            var command = msgFormula[0].toUpperCase();
            if(msg.type == "api" && command.indexOf("!AURA") !== -1) {
                if(!playerIsGM(msg.playerid)) {
                    sendChat('HealthColors', "/w " + msg.who + " you must be a GM to use this command!");
                    return;
                } else {
                    var option = msgFormula[1];
                    if(option === undefined) {
                        aurahelp();
                        return;
                    }
                    switch(msgFormula[1].toUpperCase()) {
                        case "ON":
                            state.auraColorOn = !state.auraColorOn;
                            aurahelp();
                            break;
                        case "BAR":
                            log("Checking BAR for "+msg.playerid+"...");
                            var barChoice = msgFormula[2];
                            log(" barChoice = "+barChoice);
                            if (barChoice == 'bar4') {
                                //Monster or Player
                                var oCharacter = getObj('character', obj.get("_represents"));
                                var type = (oCharacter.get("controlledby") === "" || oCharacter.get("controlledby") === "all") ? 'Monster' : 'Player';
                                if (type == 'Player') {
                                    state.auraBar = "bar4";
                                } else {
                                    state.auraBar = "bar1";
                                }
                            } else {
                                state.auraBar = "bar" + msgFormula[2];
                            }
                            aurahelp();
                            break;
                        case "TINT":
                            state.auraTint = !state.auraTint;
                            aurahelp();
                            break;
                        case "PERC":
                            state.auraPerc = parseInt(msgFormula[2], 10);
                            aurahelp();
                            break;
                        case "PC":
                            state.PCAura = !state.PCAura;
                            aurahelp();
                            break;
                        case "NPC":
                            state.NPCAura = !state.NPCAura;
                            aurahelp();
                            break;
                        case "GMNPC":
                            state.GM_NPCNames = !state.GM_NPCNames;
                            aurahelp();
                            break;
                        case "GMPC":
                            state.GM_PCNames = !state.GM_PCNames;
                            aurahelp();
                            break;
                        case "PCNPC":
                            state.NPCNames = !state.NPCNames;
                            aurahelp();
                            break;
                        case "PCPC":
                            state.PCNames = !state.PCNames;
                            aurahelp();
                            break;
                        case "DEAD":
                            state.auraDead = !state.auraDead;
                            aurahelp();
                            break;
                        case "DEADFX":
                            state.auraDeadFX = msgFormula[2];
                            aurahelp();
                            break;
                        case "SIZE":
                            state.AuraSize = parseFloat(msgFormula[2]);
                            aurahelp();
                            break;
                        default:
                            return;
                    }
                }
            }
        },
        /*
        MY FUNCTIONS
        */
        PlayDeath = function(trackname) {
            var track = findObjs({
                type: 'jukeboxtrack',
                title: trackname
            })[0];
            if(track) {
                track.set('playing', false);
                track.set('softstop', false);
                track.set('volume', 100);
                track.set('playing', true);
            } else {
                log("No track found");
            }
        },
        pcSet = function(obj, sizeSet, markerColor, pColor) {
            obj.set({
                'aura1_radius': sizeSet,
                'aura2_radius': -0.1,
                'aura1_color': markerColor,
                'aura2_color': pColor,
                'showplayers_aura1': true,
                'showplayers_aura2': true,
                'showname': state.GM_PCNames,
                'showplayers_name': state.PCNames
            });
        },
        npcSet = function(obj, sizeSet, markerColor) {
            obj.set({
                'aura1_radius': sizeSet,
                'aura2_radius': -0.1,
                'aura1_color': markerColor,
                'aura2_color': '#ffffff',
                'showplayers_aura1': true,
                'showplayers_aura2': true,
                'showname': state.GM_NPCNames,
                'showplayers_name': state.NPCNames
            });
        },
        aurahelp = function() {
            var img = "http://worldcitizenfinancial.com/wp-content/uploads/2014/07/Light-Blue-Gradient-Texture-11-1024x576.jpg";
            var tshadow = "-1px -1px #000, 1px -1px #000, -1px 1px #000, 1px 1px #000 , 2px 2px #222;";
            var style = 'style="text-align:center; width: 35px; border: 1px solid black; margin: 1px; background-color: #6FAEC7;border-radius: 4px;  box-shadow: 1px 1px 1px #707070;';
            var off = "#A84D4D";
            var FX = state.auraDeadFX.substring(0, 4);
            sendChat('HealthColors', "/w GM <b><br>" + '<div style="border-radius: 8px 8px 8px 8px; padding: 5px; text-shadow: ' + tshadow + '; box-shadow: 3px 3px 1px #707070; background-image: url(' + img + '); color:#FFF; border:2px solid black; text-align:right; vertical-align:middle;">' + '<u>Version: ' + state.HealthColors.version + //--
                '</u><br>Is On: <a ' + style + 'background-color:' + (state.auraColorOn !== true ? off : "") + ';" href="!aura on">' + (state.auraColorOn !== true ? "No" : "Yes") + '</a><br>' + //--
                'Bar: <a ' + style + '" href="!aura bar ?{BarNumber?|1}">' + state.auraBar + '</a><br>' + //--
                'Use Tint: <a ' + style + 'background-color:' + (state.auraTint !== true ? off : "") + ';" href="!aura tint">' + (state.auraTint !== true ? "No" : "Yes") + '</a><br>' + //--
                'Percentage: <a ' + style + '" href="!aura perc ?{Percent?|100}">' + state.auraPerc + '</a><br>' + //--
                'Show on PC: <a ' + style + 'background-color:' + (state.PCAura !== true ? off : "") + ';" href="!aura pc">' + (state.PCAura !== true ? "No" : "Yes") + '</a><br>' + //--
                'Show on NPC: <a ' + style + 'background-color:' + (state.NPCAura !== true ? off : "") + ';" href="!aura npc">' + (state.NPCAura !== true ? "No" : "Yes") + '</a><br>' + //--
                'Show Dead: <a ' + style + 'background-color:' + (state.auraDead !== true ? off : "") + ';" href="!aura dead">' + (state.auraDead !== true ? "No" : "Yes") + '</a><br>' + //--
                'DeathFX: <a ' + style + '" href="!aura deadfx ?{Sound Name?|None}">' + FX + '</a><br>' + //--
                '<hr>' + //--
                'GM Sees NPC Names: <a ' + style + 'background-color:' + (state.GM_NPCNames !== true ? off : "") + ';" href="!aura gmnpc">' + (state.GM_NPCNames !== true ? "No" : "Yes") + '</a><br>' + //--
                'GM Sees PC Names: <a ' + style + 'background-color:' + (state.GM_PCNames !== true ? off : "") + ';" href="!aura gmpc">' + (state.GM_PCNames !== true ? "No" : "Yes") + '</a><br>' + //--
                '<hr>' + //--
                'PC Sees NPC Names: <a ' + style + 'background-color:' + (state.NPCNames !== true ? off : "") + ';" href="!aura pcnpc">' + (state.NPCNames !== true ? "No" : "Yes") + '</a><br>' + //--
                'PC Sees PC Names: <a ' + style + 'background-color:' + (state.PCNames !== true ? off : "") + ';" href="!aura pcpc">' + (state.PCNames !== true ? "No" : "Yes") + '</a><br>' + //--
                '<hr>' + //--
                'Aura Size: <a ' + style + '" href="!aura size ?{Size?|0.7}">' + state.AuraSize + '</a><br>' + //--
                '</div>');
        },
        SetAuraNone = function(obj) {
            var tint = state.auraTint;
            if(tint === true) {
                obj.set({
                    'tint_color': "transparent",
                });
            } else {
                obj.set({
                    'aura1_color': "",
                    'aura2_color': "",
                });
            }
        },
        newColor = function(ratio) {
            var color = hsl2rgb(ratio, 100, 50);
            var hex = rgbToHex(color.r, color.g, color.b);
            return(hex);
        },
        rgbToHex = function(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },
        hsl2rgb = function(h, s, l) {
            var r, g, b, m, c, x;
            if(!isFinite(h)) h = 0;
            if(!isFinite(s)) s = 0;
            if(!isFinite(l)) l = 0;
            h /= 60;
            if(h < 0) h = 6 - (-h % 6);
            h %= 6;
            s = Math.max(0, Math.min(1, s / 100));
            l = Math.max(0, Math.min(1, l / 100));
            c = (1 - Math.abs((2 * l) - 1)) * s;
            x = c * (1 - Math.abs((h % 2) - 1));
            if(h < 1) {
                r = c;
                g = x;
                b = 0;
            } else if(h < 2) {
                r = x;
                g = c;
                b = 0;
            } else if(h < 3) {
                r = 0;
                g = c;
                b = x;
            } else if(h < 4) {
                r = 0;
                g = x;
                b = c;
            } else if(h < 5) {
                r = x;
                g = 0;
                b = c;
            } else {
                r = c;
                g = 0;
                b = x;
            }
            m = l - c / 2;
            r = Math.round((r + m) * 255);
            g = Math.round((g + m) * 255);
            b = Math.round((b + m) * 255);
            return {
                r: r,
                g: g,
                b: b
            };
        },
        checkInstall = function() {
            log('<HealthColors v' + version + ' Ready> [' + (new Date(lastUpdate * 1000)) + ']');
            if(!_.has(state, 'HealthColors') || state.HealthColors.version !== schemaVersion) {
                log('  > Updating Schema to v' + schemaVersion + ' <');
                state.HealthColors = {
                    version: schemaVersion
                };
            }
            if(!state.auraColorOn) state.auraColorOn = true; //global on or off
            if(!state.auraBar) state.auraBar = "bar1"; //bar to use
            if(!state.PCAura) state.PCAura = true; //show players Health?
            if(!state.NPCAura) state.NPCAura = true; //show NPC Health?
            if(!state.auraTint) state.auraTint = false; //use tint instead?
            if(!state.auraPerc) state.auraPerc = 100; //precent to start showing
            if(!state.auraDead) state.auraDead = true; //show dead X status
            if(!state.auraDeadFX) state.auraDeadFX = 'None'; //Sound FX Name
            if(!state.GM_NPCNames) state.GM_NPCNames = true; //show GM NPC names?
            if(!state.NPCNames) state.NPCNames = true; //show players NPC Names?
            if(!state.GM_PCNames) state.GM_PCNames = true; //show GM PC names?
            if(!state.PCNames) state.PCNames = true; //show players PC Names?
            if(!state.AuraSize) state.AuraSize = 0.7; //set aura size?
        },
        registerEventHandlers = function() {
            on('chat:message', handleInput);
            on("change:token", handleToken);
        };
    /*-------------
        RETURN OUTSIDE FUNCTIONS
        -----------*/
    return {
        CheckInstall: checkInstall,
        RegisterEventHandlers: registerEventHandlers
    };
}());
//On Ready
on('ready', function() {
    'use strict';
    HealthColors.CheckInstall();
    HealthColors.RegisterEventHandlers();
});
