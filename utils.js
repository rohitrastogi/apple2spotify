var cheerio = require('cheerio')
var axios = require('axios')


exports.scrapeSongData = async (url) => {
    try {
        data = {}
        let songs = []
        const response = await axios.get(url)
        const $ = cheerio.load(response.data)
        data.playlist_name = $('body').find($('.product-header__title')).text()
        $('body').find($('.tracklist-item__text')).map((i, el) => {
            let song = {}
            const title = $(el).find('.spread').text().trim()
            const artist = $(el).find('.we-truncate').find('a')[0].attribs['data-test-song-artist-url']
            song.title = title
            song.artist = artist  
            songs.push(song)
        })
        data.songs = songs
        return data
    } 
    catch (error) {
        return {
            error: "error"
        };
    }
}

exports.getSongURI = async (token, playlistData, i) => {
    try {
        const song = playlistData.songs[i]
        const response = await axios({
            method: 'get',
            url: 'https://api.spotify.com/v1/search?query=track%3A' + song.title + '+artist%3A' + song.artist + '&type=track&market=US&offset=0&limit=1',
            headers: {
                Authorization: 'Bearer ' + token
            }
        })
        if (response.data.tracks.items[0] != undefined){
            const id = response.data.tracks.items[0].url
            playlistData.songs[i].uri = uri
            return uri
        } else {
            return ""
        }
    } catch(error){
        console.log(error)
    }
}

exports.getAllSongURIs = async(token, playlistData) => {
    try {
        console.log('Gathering song IDs from Spotify...')
        let promises = []
        for (i = 0; i < playlistData.songs.length; i++){
            promises.push(getSongID(token, playlistData, i))
        }
        return Promise.all(promises) 
    } catch(error){
        console.log(error)
    }
}

exports.createPlaylist = async(spotifyID, token, playlistData) => {
    console.log('Creating Spotify Playlist...')
    try {
        const response = await axios({
            method: 'post',
            url: 'https://api.spotify.com/v1/users/' + spotifyID + '/playlists',
            params: {
                name: playlistData.playlist_name, 
                public: false
            },
            headers: {
                Authorization: 'Bearer ' + token
            }
        })
        console.log(response)
        return {id: response.id, external_urls: response.external_urls}

    } catch (error){
        console.log(error)
    }
}

//need to check length of songURIs. if greater than 100, need multiple requests
exports.addSongsToPlayist = async(playlistMetadata, songURIs, token) => {
    console.log('Add songs to Playlist...')
    try {
        const response = await axios({
            method: 'post',
            url: 'https://api.spotify.com/v1/playlists/' + playlistMetadata.playlistID+ '/tracks',
            params: {
                uris: songURIs
            },
            headers: {
                Authorization: 'Bearer ' + token
            }
        })
        console.log(response)
        return playlistMetadata.external_urls

    } catch (error){
        console.log(error)
    }
}

//improve error chain
exports.buildPlaylist = async(spotifyID, token, playlistData) => {
    getAllSongURIs(token, playlistData).then(songURIs => {
        songURIs = songURIS.filter(uri => uri != "")
        songURIs = JSON.stringify(songURIs)
        createPlaylist(playlistData, token, spotifyID).then(playlistMetadata => {
            addSongsToPlayist(playlistMetadata, songURIS, token).then(urls => {
                return urls
            })
        })
    })
}