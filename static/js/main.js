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
function setStyle (el, obj) {
    Object.entries(obj).forEach(([k, v]) => {
      el.style[k] = v
    })
  }


function insertCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
async function searchUser (querry) {
    // eslint-disable-next-line no-undef
    const content = document.getElementById('u-search-content')
    content && (content.innerHTML = '')
    if (querry.length != 0) {
        axios.get('https://fysix.xyz/apiv1/search?q=' + querry)
        .then(r => {
            r = r.data
            console.log(r);
            if (r.length != 0) {
              content && content.removeAttribute('style')
                content.innerHTML = ""
                for (el of r) {
                    console.log(el);
                    const result = ({
                    title: el.name,
                    url: '/u/' + el.id,
                    image: '//a.fysix.xyz/' + el.id
                    })
                    const root = document.createElement('a')
                    root.href = result.url
                    root.className = 'navbar-item'
                    const image = document.createElement('img')
                    image.src = result.image
                    setStyle(image, {
                    width: '3rem',
                    maxHeight: '3rem',
                    backgroundSize: 'cover',
                    borderRadius: '0.5em'
                    })
                    root.appendChild(image)
                    const textSpan = document.createElement('span')
                    setStyle(textSpan, {
                    marginLeft: '5px',
                    fontWeight: 700,
                    fontSize: '1.2em',
                    color: 'rgba(255,255,255,0.9)'
                    })
                    textSpan.innerText = result.title
                    root.appendChild(textSpan)
                    content && content.appendChild(root)
    }}});
    } else {
      content && setStyle(content, {
        display: 'none'
      })
    }
  }