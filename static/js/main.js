// sticky header
$(window).scroll(() => {
    var header = document.getElementById("navbar");
    var sticky = header.offsetTop;

    if (window.pageYOffset > sticky) {
        header.classList.add("minimized");
    } else {
        header.classList.remove("minimized");
    }
});

//toggle navbar for mobile
function togglenavbar() {
    document.getElementById('navbar').classList.toggle("is-active");
    document.getElementById('navbar-burger').classList.toggle("is-active");
}
function search() {
    document.getElementById('u-search-content').innerHTML = "";
    $("#u-search").search({
        onSelect: function (val) {
          window.location.href = val.url;
          return false;
        },
        apiSettings: {
          url: "/api/v1/search?q={query}",
          onResponse: function (resp) {
            var r = {
              results: [],
            };
            $.each(resp.users, function (index, item) {
              r.results.push({
                title: item.username,
                url: "/u/" + item.id,
                image: hanayoConf.avatars + "/" + item.id,
              });
            });
            return r;
          },
        },
      });}
