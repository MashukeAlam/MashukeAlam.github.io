function getLinks() {
    $.getJSON('https://api.github.com/repos/MashukeAlam/VarsityCodes/contents', function (items) {
        if (!Array.isArray(items)) return;
        items.forEach(function (item, i) {
            var btn = document.createElement('button');
            btn.className = 'btn btn-success';
            btn.type = 'button';
            btn.innerText = item.name;
            btn.style.marginBottom = '6px';
            btn.style.marginLeft = '6px';
            btn.onclick = function () {
                window.open(item.html_url, '_blank');
            };
            document.body.appendChild(btn);

            var newline = document.createElement('br');
            if (i % 5 === 0 && i !== 0) document.body.appendChild(newline);
        });
    }).fail(function () {
        console.warn('Could not fetch repository contents from GitHub API.');
    });
}

getLinks();
