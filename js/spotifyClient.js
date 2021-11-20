class SpotifyClient {

    clientId = SPOTIFY_API_ID;
    clientSecret = SPOTIFY_API_SECRET;
    apiRedirect = SPOTIFY_API_REDIRECT;
    clientScopes = 'user-read-private%20user-top-read';
    apiBase = 'https://accounts.spotify.com/';

    /* 
        Authentication 
    */

    _getAuthCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');

        if (authCode == null)
            window.location.href = "https://accounts.spotify.com/authorize?client_id=" + this.clientId + "&response_type=code&redirect_uri=" + this.apiRedirect + "&scope=" + this.clientScopes + "&state=34fFs29kd09";

        return authCode;
    }

    async _getAuthTokenByAuthCode() {
        const authCode = this._getAuthCode();

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
            },
            body:
                'grant_type=authorization_code' +
                '&code=' + authCode +
                '&redirect_uri=' + this.apiRedirect
        });

        const data = await result.json();
        if (data.error)
            this._getAuthCode();

        window.sessionStorage.setItem('refreshToken', data.refresh_token);
        window.history.pushState({}, document.title, '/'); // remove querystring
        return data.access_token;
    }

    async _getAuthTokenByRefreshToken(refreshToken) {
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
            },
            body:
                'grant_type=refresh_token' +
                '&refresh_token=' + refreshToken
        });

        const data = await result.json();
        if (data.error) {
            window.sessionStorage.removeItem('refreshToken');
            this.accessToken = await this._getAuthTokenByAuthCode();
        }

        return data.access_token;
    }

    async login() {
        const refreshToken = window.sessionStorage.getItem('refreshToken');

        if ((refreshToken != null) && (refreshToken != "undefined"))
            this.accessToken = await this._getAuthTokenByRefreshToken(refreshToken);
        else
            this.accessToken = await this._getAuthTokenByAuthCode();
    }

    logout() {
        window.sessionStorage.removeItem('refreshToken');
        const spotifyLogoutWindow = window.open('https://www.spotify.com/logout/', 'Spotify Logout', 'width=500,height=500,top=40,left=40');
        setTimeout(() => spotifyLogoutWindow.close(), 2000);
        setTimeout(() => location.reload(), 3000);
    }

    /* 
        Api Requests 
    */

    // Default API request
    async _apiRequest(endpoint, params) {

        let paramString = '?';
        for (let param in params)
            paramString += `${param}=${params[param]}&`;

        const result = await fetch(`https://api.spotify.com/v1${endpoint + paramString.slice(0, -1)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + this.accessToken
            }
        });

        const data = await result.json();

        if (data.error)
            console.log(`${data.error}: ${data.message}`);

        return data;
    }

    // Get Account Info
    async getAccountInfo() {
        return this._apiRequest('/me');
    }

    accountTopRange = { all: 'long_term', last6Months: 'medium_term', last4Weeks: 'short_term' };

    // Get top items of type
    async _getAccountTop(type, params = {}) {
        return this._apiRequest(`/me/top/${type}`, params);
    }

    // Get Songs
    async _getSongs(songIds) {
        return this._apiRequest(`/tracks?ids=${songIds}`);
    }

    // Get top songs
    async getTopSongs(limit = 10, range = this.accountTopRange.last6Months) {
        const params = { limit: limit, time_range: range };
        let songIds = [];

        // Get top n(limit) songs
        const data = await this._getAccountTop('tracks', params);

        // Select all id's from the songs
        if (data.items) {
            for (let item of data.items)
                songIds.push(item.id);
        }

        // Get all song details (for preview url's)
        const songs = await this._getSongs(songIds);

        return songs.tracks;
    }

    // Get top genres
    async getTopGenres(limit = 10, range = this.accountTopRange.last6Months) {
        const params = { limit: 50, time_range: range };
        let genres = [], rawGenres = {};

        // Get top 50 artists
        const data = await this._getAccountTop('artists', params);

        if (data.items) {

            // Get all genres of top 50 artists
            for (let item of data.items) {
                for (let genre of item.genres) {
                    if (rawGenres[`${genre} `] == null) rawGenres[`${genre} `] = [];
                    rawGenres[`${genre} `].push(item.name);
                }
            }

            // Convert object to array
            for (let genre in rawGenres)
                genres.push({ name: genre, artists: rawGenres[genre] });

            // Sort array by artist count and select first n(limit) genres
            genres.sort((genre1, genre2) => (genre1.artists.length > genre2.artists.length) ? -1 : 1);
            genres = genres.slice(0, limit);

        }

        return genres;
    }
}