new Vue({
    el: "#app",
    delimiters: ["<%", "%>"],
    data() {
        return {
            data: {
                stats: {
                    out: [{}],
                    load: true
                },
                grades: {},
                scores: {
                    recent: {
                        out: [],
                        load: true,
                        more: {
                            limit: 5,
                            full: true
                        }
                    },
                    best: {
                        out: [],
                        load: true,
                        more: {
                            limit: 5,
                            full: true
                        }
                    },
                    pinned: {
                        out: [],
                        load: true,
                        more: {
                            limit: 5,
                            full: true
                        }
                    },
                    first: {
                        out: [],
                        load: true,
                        more: {
                            limit: 5,
                            full: true
                        }
                    },
                },
                maps: {
                    most: {
                        out: [],
                        load: true,
                        more: {
                            limit: 6,
                            full: true
                        }
                    }
                },
                leaderboard_history: {},
                status: {}
            },
            mode: mode,
            mods: mods,
            modegulag: 0,
            userid: userid
        };
    },
    created() {
        // starting a page
        this.modegulag = this.StrtoGulagInt();
        this.LoadProfileData();
        this.LoadAllofdata();
        this.LoadUserStatus();
    },
    methods: {
        LoadAllofdata() {
            this.LoadMostBeatmaps();
            this.LoadScores('best');
            this.LoadScores('recent');
            this.LoadScores('pinned');
        },
        LoadProfileData() {
            this.$set(this.data.stats, 'load', true);
            this.$axios.get(`${window.location.protocol}//api.${domain}/get_player_info`, {
                    params: {
                        id: this.userid,
                        scope: 'all'
                    }
                })
                .then(res => {
                    console.log(res.data.player.stats)
                    this.$set(this.data.stats, 'out', res.data.player.stats);
                    this.data.stats.load = false;
                    this.LoadLeaderboardHistory();
                });
        },
        LoadScores(sort) {
            this.$set(this.data.scores[`${sort}`], 'load', true);
            this.$axios.get(`${window.location.protocol}//api.${domain}/get_player_scores`, {
                    params: {
                        id: this.userid,
                        mode: this.StrtoGulagInt(),
                        scope: sort,
                        limit: this.data.scores[`${sort}`].more.limit
                    }
                })
                .then(res => {
                    this.data.scores[`${sort}`].out = res.data.scores;
                    this.data.scores[`${sort}`].load = false
                    this.data.scores[`${sort}`].more.full = this.data.scores[`${sort}`].out.length != this.data.scores[`${sort}`].more.limit;
                });
        },
        LoadMostBeatmaps() {
            this.$set(this.data.maps.most, 'load', true);
            this.$axios.get(`${window.location.protocol}//api.${domain}/get_player_most_played`, {
                    params: {
                        id: this.userid,
                        mode: this.StrtoGulagInt(),
                        limit: this.data.maps.most.more.limit
                    }
                })
                .then(res => {
                    this.data.maps.most.out = res.data.maps;
                    this.data.maps.most.load = false;
                    this.data.maps.most.more.full = this.data.maps.most.out.length != this.data.maps.most.more.limit;
                });
        },
        LoadUserStatus() {
            this.$axios.get(`${window.location.protocol}//api.${domain}/get_player_status`, {
                    params: {
                        id: this.userid
                    }
                })
                .then(res => {
                    console.log(res.data.player_status)
                    this.$set(this.data, 'status', res.data.player_status)
                })
                .catch(function (error) {
                    clearTimeout(loop);
                    console.log(error);
                });
            loop = setTimeout(this.LoadUserStatus, 5000);
        },
        ChangeModeMods(mode, mods) {
            if (window.event)
                window.event.preventDefault();

            this.mode = mode;
            this.mods = mods;

            this.modegulag = this.StrtoGulagInt();
            this.data.scores.recent.more.limit = 5
            this.data.scores.best.more.limit = 5
            this.data.maps.most.more.limit = 6
            this.LoadAllofdata();
            this.LoadLeaderboardHistory();
        },
        AddLimit(which) {
            if (window.event)
                window.event.preventDefault();

            if (which == 'bestscore') {
                this.data.scores.best.more.limit += 5;
                this.LoadScores('best');
            } else if (which == 'recentscore') {
                this.data.scores.recent.more.limit += 5;
                this.LoadScores('recent');
            } else if (which == 'mostplay') {
                this.data.maps.most.more.limit += 4;
                this.LoadMostBeatmaps();
            }
        },
        actionIntToStr(d) {
            switch (d.action) {
                case 0:
                    return 'Idle: 🔍 Song Select';
                case 1:
                    return '🌙 AFK';
                case 2:
                    return `Playing: 🎶 ${d.info_text}`;
                case 3:
                    return `Editing: 🔨 ${d.info_text}`;
                case 4:
                    return `Modding: 🔨 ${d.info_text}`;
                case 5:
                    return 'In Multiplayer: Song Select';
                case 6:
                    return `Watching: 👓 ${d.info_text}`;
                    // 7 not used
                case 8:
                    return `Testing: 🎾 ${d.info_text}`;
                case 9:
                    return `Submitting: 🧼 ${d.info_text}`;
                    // 10 paused, never used
                case 10:
                    return  `Paused (cheating)`;
                case 11:
                    return 'Idle: 🏢 In multiplayer lobby';
                case 12:
                    return `In Multiplayer: Playing 🌍 ${d.info_text} 🎶`;
                case 13:
                    return 'Idle: 🔍 Searching for beatmaps in osu!direct';
                default:
                    return 'Unknown: 🚔 not yet implemented!';
            }
        },
        LoadLeaderboardHistory() {
            this.$axios.get(`https://new.fysix.xyz/get_leaderboard_history`, {
                params: {
                    uid: this.userid,
                    mode: this.StrtoGulagInt(),
                }
            })
                .then(res => {
                    let wrapper_elem = $('.leaderboard-history-block');

                    wrapper_elem.css({
                        'display': 'block',
                    });

                    // Add current data to info.
                    res.data.days.push(0);
                    res.data.ranks.push(this.data.stats.out[this.modegulag].rank);

                    new Chart("leaderboard-history", {
                        type: "line",
                        data: {
                            labels: res.data.days,
                            datasets: [{
                                data: res.data.ranks,
                                backgroundColor: "rgba(255, 204, 34, 0)",
                                borderColor: "#FFCC22",
                                borderWidth: 3,
                                pointRadius: 0,
                                pointLabelFontSize : 4,
                                fill: false,
                                lineTension: .3,
                                borderCapStyle: 'round',
                                borderDash: [],
                                borderDashOffset: 0.0,
                                borderJoinStyle: 'bevel',
                                pointBorderWidth: 1,
                                pointHoverRadius: 6,
                                pointHoverBackgroundColor: "rgba(255, 204, 34, 1)",
                                pointHoverBorderColor: "rgba(255, 204, 34, 1)",
                                pointHoverBorderWidth: 2,
                                pointHitRadius: 10,
                                spanGaps: false,
                            }]
                        },
                        options: {
                            layout: {
                                padding: 12,
                            },
                            legend: {
                                display: false
                            },
                            hover: {
                                intersect: false
                            },
                            tooltips: {
                                mode: 'index',
                                intersect: false,
                                displayColors: false,
                                callbacks: {
                                    label: function(item, data) {
                                        return res.data.days.length - 1 === item.index ? 'now' : `${res.data.days.length - item.index - 1} days ago`;
                                    },
                                    title: function(item, data) {
                                        return `Global ranking #${item[0].value}`;
                                    }
                                }
                            },
                            plugins: {
                                datalabels: {
                                    display: false
                                },
                            },
                            scales: {
                                gridLines: {
                                    offsetGridLines: 2,
                                },
                                yAxes: [{

                                    ticks: {
                                        display: false,
                                        reverse: true,
                                    },
                                    gridLines: {
                                        color: "rgba(0, 0, 0, 0)",
                                        drawBorder: false,
                                    }
                                }],
                                xAxes: [{
                                    ticks: {
                                        display: false
                                    },
                                    gridLines: {
                                        color: "rgba(0, 0, 0, 0)",
                                        drawBorder: false,
                                    },
                                }],
                                x: {
                                    grid: {
                                        drawBorder: false,
                                    },
                                },
                                y: {
                                    grid: {
                                        drawBorder: false,
                                    },
                                },
                            }
                        }
                    });
                });
        },
        addCommas(nStr) {
            return nStr.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        secondsToDhm(seconds) {
            seconds = Number(seconds);
            var dDisplay = `${Math.floor(seconds / (3600 * 24))}d `;
            var hDisplay = `${Math.floor(seconds % (3600 * 24) / 3600)}h `;
            var mDisplay = `${Math.floor(seconds % 3600 / 60)}m `;
            return dDisplay + hDisplay + mDisplay;
        },
        StrtoGulagInt() {
            switch (this.mode + "|" + this.mods) {
                case 'std|vn':
                    return 0;
                case 'taiko|vn':
                    return 1;
                case 'catch|vn':
                    return 2;
                case 'mania|vn':
                    return 3;
                case 'std|rx':
                    return 4;
                case 'taiko|rx':
                    return 5;
                case 'catch|rx':
                    return 6;
                case 'std|ap':
                    return 8;
                default:
                    return -1;
            }
        },
        StrtoModeInt() {
            switch (this.mode) {
                case 'std':
                    return 0;
                case 'taiko':
                    return 1;
                case 'catch':
                    return 2;
                case 'mania':
                    return 3;
            }
        },
    },
    computed: {}
});
function scoreMenu($this) {
    const score_id = $($this).attr("data--score-id");
    let menu;

    $.ajax({
        url: `https://fysix.xyz/score/${ score_id }`,
        type: 'GET',
        success: function(response) {
            $($this).append(
                $(`<div class="score-menu" data--score-id="${score_id}" onclick="viewDetails(this);"><div class="menu-contents"><i class="fa-solid fa-download"></i><span>View Details</span></div></div>`)
            );
        },
        error: function(xhr) {
            $($this).append(
                 $(`<div class="score-menu score-unavailable"><div class="menu-contents"><i class="fa-solid fa-download"></i><span>no</span></div></div>`)
            );
        }
    });
}

function downloadScore($this) {
    const score_id = $($this).attr("data--score-id");

    // Open link to download replay using API.
    window.open(`${window.location.protocol}//api.fysix.xyz/get_replay?id=${ score_id }`, '_blank').focus();
}
function viewDetails($this) {
    const score_id = $($this).attr("data--score-id");

    // Open link to download replay using API.
    window.open(`${window.location.protocol}//fysix.xyz/score/${ score_id }`, '_blank').focus();
}