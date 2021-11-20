const showSongs = async function (spotifyClient) {
    const songs = await spotifyClient.getTopSongs(10, spotifyClient.accountTopRange.last6Months);
    let htmlSongs = ``;

    for (let songId in songs) {
        const song = songs[songId];
        const songImage = song.album.images[song.album.images.length - 1].url;
        const songName = song.name;
        const songPreview = song.preview_url;

        let songArtists = ``;
        for (let artist of song.artists)
            songArtists += artist.name + ', ';
        songArtists = songArtists.slice(0, -3);

        htmlSongs += `<li class="c-song">
                <audio class="js-preview-${songId}" src="${songPreview == null ? '' : songPreview}"></audio>
                <div class="c-song__position">${parseInt(songId) + 1}</div>
                <div class="c-song__control c-control">
                    <input class="o-hide-accessible c-control__checkbox js-control" data-id="${songId}" type="checkbox" id="controlMusic${songId}" ${songPreview == null ? 'disabled' : ''} />
                    <label class="c-control__label" for="controlMusic${songId}">
                        <svg class="c-control__icon c-control__icon--play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        <svg class="c-control__icon c-control__icon--pause" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    </label>
                </div>
                <img class="c-song__image" src="${songImage}" alt="" />
                <div class="c-song__name">${songName}</div>
                <div class="c-song__artist">${songArtists}</div>
            </li>`;
    }

    document.querySelector('.js-top-songs').innerHTML = htmlSongs;
    listenToControl();
};

const showGenres = async function (spotifyClient) {
    const genres = await spotifyClient.getTopGenres(10, spotifyClient.accountTopRange.last6Months);

    let htmlGenres = ``;
    for (let genre of genres) {
        const percentage = genre.artists.length * 100 / genres[0].artists.length;
        htmlGenres += `<li class="c-genre">
                <p class="c-genre__name">${genre.name}</p>
                <div class="c-genre__bar" style="width: ${percentage}%"></div>
            </li>`;
    }

    document.querySelector('.js-top-genres').innerHTML = htmlGenres;
};

const listenToLogout = function (spotifyClient) {
    document.querySelector('.js-logout').addEventListener('click', spotifyClient.logout);
};

const listenToControl = function () {
    const controlButtons = document.querySelectorAll('.js-control');

    for (let controlButton of controlButtons) {
        const controlButtonId = controlButton.dataset.id;
        const preview = document.querySelector(`.js-preview-${controlButtonId}`);

        // Start / Stop music
        controlButton.addEventListener('change', function () {
            if (controlButton.checked) {

                // pause all other previews
                for (let cb of controlButtons) {
                    if (cb.dataset.id != controlButtonId) {
                        cb.checked = false;
                        document.querySelector(`.js-preview-${cb.dataset.id}`).pause();
                    }
                }

                preview.play();
            }
            else {
                preview.pause();
            }
        });

        // Reset playbutton
        preview.addEventListener('ended', function () {
            controlButton.checked = false;
        });
    }
};

document.addEventListener('DOMContentLoaded', async function () {
    const spotifyClient = new SpotifyClient();
    await spotifyClient.login();

    listenToLogout(spotifyClient);

    showSongs(spotifyClient);
    showGenres(spotifyClient);
});