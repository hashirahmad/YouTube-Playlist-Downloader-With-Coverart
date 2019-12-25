const chrome = require('puppeteer')
const jsonfile = require('jsonfile')
const readTextFile = require('read-text-file')
const arg = require("yargs").argv
const fs = require('fs')
const path = require('path')
const mv = require('mv')
const cliProgress = require("cli-progress")
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
const prompt = require('prompt')


let FileNames = jsonfile.readFileSync('./FileNames.json')


cli()


function getFileInArray(name) {
    
    let file = readTextFile.readSync( name )
    let arrayFile = file.split('\n')
    return arrayFile

}

async function saveFileNamesJSON(json) {
    
    let filePath = './FileNames.json'
    try {
        await jsonfile.writeFile( filePath, json, { spaces: 4 } )
        console.log('FileNames.json successfully updated')
    } catch (e) {
        console.error('Error happened while updating FileNames.json\nHere is the error:\n\n', e)
    }
}

function extractVideoURLsFromPlaylist() {

    let urls = []

    let div = document.querySelectorAll('#contents > ytd-playlist-video-renderer')
    let hrefClass = '.yt-simple-endpoint.style-scope.ytd-playlist-video-renderer'

    for (let d in div) {

        div[ d ].querySelector && urls.push( div[ d ].querySelector(hrefClass).href )

    }
    return urls.join('\n')

}

function sleep(sec) {
    return new Promise( res => {

        progressBar.start(sec, 0)
        let progressValue = 0
        let incrementer = setInterval(() => {
            progressBar.update( ++progressValue )
        }, 1000)

        setTimeout( () => {
            clearInterval(incrementer)
            progressBar.stop()
            res()
        }, sec * 1000 );

    })
}

async function run(i) {

    let options = {
        width: 1600,
        height: 1200
    }
    let q = `Press any key once download location is set in the browser`
    const browser = await chrome.launch({ 
        headless: false,
        // devtools: true,
        args: [`--window-size=${options.width},${options.height}`] // new option
    });

    const page = await browser.newPage()
    await page.setViewport({
        width: options.width,
        height: options.height,
        deviceScaleFactor: 1,
    })

    prompt.get([q], (e, result) => {

        let res = result[q]
        console.log('\n\n           Main program starting . . .\n\n')
        main()

    })

    async function main() {

        /*
            You can run it in a for loop but it is difficult to organize
            the files into categories or playlists
            This is why I am going to do one at a time
            So afterwards I can organize it into appopriate folder
            This would not be neccessary if there was a way to get access to downloaded
            file 
        */
        if ( i >= 0 && typeof FileNames[ i ] === 'object' ) {
    
            let name = `${ __dirname }/Playlists/${ FileNames[i].name }`
            let fileArray = getFileInArray(name);
    
            // let s = await downloadItFromUrl('https://www.youtube.com/watch?v=H9vevyszht4', page)
            // console.log(JSON.stringify(s, null, 4), ' => Download Started')
            // s = await downloadItFromUrl('https://www.youtube.com/watch?v=7YuKKZosPko', page)
            // console.log(JSON.stringify(s, null, 4), ' => Download Started')
            for (let url in fileArray) {
    
                let name = FileNames[i].stats[url] && FileNames[i].stats[url].name
                if ( name === undefined || name === "" ) {
    
                    let stats = await downloadItFromUrl( fileArray[ url ], page, url, fileArray.length )
                    FileNames[ i ].stats[ url ] = stats
                    FileNames[ i ].completed = parseInt( url ) + 1
                    FileNames[ i ].lastDone = fileArray[ url ]
    
                } else console.log(`Did work (${url} of ${fileArray.length}):    `, name)
    
            }
            FileNames[ i ].done = true
            await saveFileNamesJSON(FileNames)
            await moveEachFileInOwnFolder(`${__dirname}/Media/${FileNames[i].name}`, FileNames[i])
            console.log('\n\nAll done.\nClosing browser . . .')
            await browser.close()
            return
    
        } else {
    
            console.log('You did not pass valid index for the file: FileNames.json\nTry again!')
            await browser.close()
            return
        }

    }


}

async function downloadItFromUrl( url, page, i, size ) {
    
    let videoStats = {

        name: "",
        size: "",
        length: "",
        url

    }
    try {
    
        await page.goto('https://ytmp3.eu/', {
            timeout: (1 * 60) * 1000
        })
        await page.evaluate( downloadUrl => {
            
            function walk(elm) {
                
                var node;
                
                // Handle child elements
                for (node = elm.firstChild; node; node = node.nextSibling) {
                    if (node.nodeType === 1) { // 1 == Element
                        walk(node);
                    }
                }
            }
            
            window.video_url.value = downloadUrl
            window.submitButton.click()
                    
        }, url )
        try {
            await page.waitFor('.download3.cresponsive_result', { timeout: ( 4 * 60 ) * 1000 })
            videoStats = await page.evaluate( (url) => {
            
                return {
        
                    name: document.querySelector('.download3.cresponsive_result').textContent,
                    size: window.myImageId44.textContent.split('|')[1].trim(),
                    length: window.myImageId44.textContent.split('|')[2].trim().replace(')', ''),
                    url
                }
                
            }, url )
            console.log(`Did work (${i} of ${size}):    `, videoStats.name )
            
        } catch (e) {

            console.log(`Did NOT work (${i} of ${size}):    `, url)
        }
        
    } catch (e) {
        console.log(`Did NOT work (${i} of ${size}):    `, url)
        console.log(`https://ytmp3.eu/ is not responding. Waited for 1 minute.`)
    }
    return videoStats
}

function mkdir( dir ) {

    if ( fs.existsSync( dir ) === false ) {

        fs.mkdirSync( dir )
        console.log('Folder created:', dir)

    }

}

async function moveEachFileInOwnFolder(dir, obj){

    console.log('Waiting for 1.5 minutes for last download(s) to finish\n\n')
    let folderAcronym = nameToAcronym(obj.name)
    
    await sleep(60 * 1.5)
    await renameFiles(dir, folderAcronym)
    // createFolderForEachFile(obj, dir)
}


function nameToAcronym(name) {
    
    let acronym = ''
    let splittedName = name.split(' ')
    for ( let w in splittedName ) {
        
        acronym += splittedName[w][0]
        
    }
    return acronym
    
}

async function renameFiles(dir, acronym) {
    
    console.log('Renaming files with Folder acronym so it is easier to find . . . \n', dir)
    try {
        
        let files = fs.readdirSync(dir)
        console.log('Files are:', JSON.stringify(files, null, 4) )
        for (let f in files) {
    
            if ( files[f].endsWith('.mp3') && files[f].startsWith(`(${acronym})`) === false ) {

                let filePath = path.join(dir, files[f])
                let newFilePath = path.join(dir, `(${acronym}) ${files[f]}`)
                try {
                    fs.renameSync(filePath, newFilePath)
                    console.log('Rename:', newFilePath)
                    mkdir( path.join(dir, files[f].replace(/[^\w\s]mp3/gi, "")) )
                    mv(
                      newFilePath,
                      path.join(dir, files[f].replace(/[^\w\s]mp3/gi, ""), `(${acronym}) ${files[f]}`),
                      e => {
                          if (e) {
                              console.error('Moved: Error happened while moving after renaming\n', e)
                          } else console.log("Moved:", files[f]);
                      }
                    )
                } catch (e) {
                    console.error('Rename: DID NOT WORK =>', newFilePath , '\nError is:\n', e)
                }

            } else console.log(`Rename: Folder or Already renamed => ${files[f]}`)

        }
        
    } catch (e) {
        console.log('Error happened while trying to read files for renaming', e)
    }
}

function createFolderForEachFile(obj, dir) {
    
    console.log('Creating folders for each file\n\n')
    let filePath = path.join(__dirname, 'Media', obj.name)
    let files = fs.readdirSync(dir)




    for ( let f in obj.stats ) {
        
        let fsPath = path.join( filePath, obj.stats[f].name.replace(/[^\w\s]/gi, '') )
        mkdir(fsPath)
        
    }

}

function cli() {

    if ( FileNames.length ) {
        
        prompt.start()
        let questions = [
            `Enter a valid index between 0 - ${FileNames.length - 1} for FileNames.json`
        ]
    
        prompt.get([questions[0]], function(err, result) {
            
            if (err) {
                return onErr(err)
            }
            let i = parseInt( result[ questions[0] ] )
            if ( i >= 0 && i < FileNames.length ){

                console.log( 'Playlist to cover:\n', JSON.stringify( FileNames[i], null, 4 ) )

                mkdir( `${ __dirname }/Media/${ FileNames[i].name }` )
                
                console.log('\n\nThis folder need to be set as download location:')
                console.log('\n\n        => ', `${ __dirname }/Media/${ FileNames[i].name }`)
                
                run(i)


            } else console.log('Wrong input. Exiting . . . ')
        
        })
    
        function onErr(err) {
            console.log(err)
            return 1
        }

    } else console.warn('FileNames.json is empty. Please first populate it.')

}