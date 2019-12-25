# YouTube-Playlist-downloader-with-cover-art
Semi-automatic script to download videos from youtube playlist to mp3 files with cover art for offline usage<br>
***This is a side project.***<br>
***It is not production ready code***

## Why?
I listen to my music offline. <br>
Simply not enough data.<br>
But I like my music to have cover art.<br>
In android, cover art is displayed for each folder if there is any.<br>
So if you have 10 songs, for the correct cover art to be shown, each song needs to reside in its own folder<br>
Also if I have a playlist of 1000+ songs - manually downloading is too much of a waste of time and tedious<br>
It also ***acronyms the folder*** into file name so it is easier to find in music player<br>

## Step 1
Go a youtube playlist page for example like [this one](https://www.youtube.com/playlist?list=PLPRWzxnOw1DLhVqjj2Z_1XfzimnPF7Vh7)
Make sure you scroll all the way to the bottom and all the entire playlist is loaded correctly.<br> ***This is very important!***
<br>Run ***this*** code in Developer Tools

    function run(){
	    function  extractVideoURLsFromPlaylist()  {
			let  urls  = []
			let  div  =  document.querySelectorAll('#contents > ytd-playlist-video-renderer')
			let  hrefClass  =  '.yt-simple-endpoint.style-scope.ytd-playlist-video-renderer'

			for (let  d  in  div) {
				div[ d ].querySelector  &&  urls.push( div[ d ].querySelector(hrefClass).href )
			}
			return  urls.join('\n')
		}
		return extractVideoURLsFromPlaylist()
    }
    run()
 
It should print a URL per line
Copy this and paste it in a ***YOUR_NEW_FILE.txt***
Make youre ***YOUR_NEW_FILE.txt*** is in the `Playlists` folder and `Playlists` is located in the same directory as `FileNames.json`

## Step 2
Locate the file `FileNames.json` and paste the following in your file:

    {
		"name":  "YOUR_NEW_FILE Name",
		"done":  false,
		"completed":  0,
		"lastDone":  "",
		"stats":  []
	}

## Step 3
Create a new folder by name: ***MEDIA*** (Can be anything)
Open the terminal/bash/cmd in the folder where `index.js` and `FileNames.json` resides   

run `node index.js` and follow the ***on-screen instructions***
**Enjoy!**

