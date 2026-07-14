[![Publish package nodejs](https://github.com/hajilok/youtube-live-streaming/actions/workflows/npm-publish.yml/badge.svg?event=check_run)](https://github.com/hajilok/youtube-live-streaming/actions/workflows/npm-publish.yml)

Thanks for 50 stars

# youtube-live-streaming
This is a simple node js code to create live streaming on YouTube 24/7 hours with ffempg

## Quick start

Requirements:

- Node.js 20 or newer
- FFmpeg available on `PATH`
- An RTMP/RTMPS stream URL and stream key

Install and run the status service:

```sh
npm install
copy .env.example .env
npm start
```

On Linux or macOS, use `cp .env.example .env` instead of `copy`.
Set `STREAM_URL` and `STREAM_KEY` in `.env` to start streaming. The default
URL is YouTube's RTMP ingest endpoint. Without a stream key, the service runs
safely without launching FFmpeg.

Configuration:

```dotenv
STREAM_URL=rtmp://a.rtmp.youtube.com/live2
STREAM_KEY=your-youtube-stream-key
VIDEO_SOURCE=hajilok.mov
AUDIO_SOURCE=https://stream.zeno.fm/ez4m4918n98uv
LOOP=true
PORT=3000
```

For multiple ordered media sources, use JSON arrays. These override
`VIDEO_SOURCE` and `AUDIO_SOURCE`:

```dotenv
VIDEO_SOURCES=["video-1.mp4","https://example.com/video-2.mp4"]
AUDIO_SOURCES=["audio-1.mp3","https://example.com/audio-2.mp3"]
COVER_SOURCE=https://example.com/cover.jpg
LOOP=true
BOT_LANGUAGE=en
```

Check service state at `GET /health`. To enter values interactively instead,
run `npm run interactive`.

## Telegram control bot

Create a bot with BotFather, then configure its token and the numeric Telegram
user IDs that may control streams:

```dotenv
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_ADMIN_IDS=123456789
AUTO_START=false
```

Multiple admin IDs can be separated with commas. Bot control is disabled
unless both variables are configured. Use the bot only in a private chat.

Commands:

```text
/setup      Configure destination, media playlists, cover, and loop mode
/startlive  Prepare media and start FFmpeg
/endlive    End the current stream
/status     Show configuration and process state
/language   Select Khmer or English
/cancel     Cancel the current setup
```

The setup flow accepts:

- Multiple local video/audio/image file paths
- Multiple direct `http://` or `https://` media URLs
- Multiple public Google Drive sharing links
- Video, audio, image, or document uploads sent directly to the Telegram bot

During setup, send each video or audio item separately and tap **Done** after
the playlist is complete. Video and audio preserve their entered order. A
cover image can provide the visual for an audio-only stream when the video
playlist is empty. The final setup step selects either continuous 24/7 looping
or one pass through the playlists.

Use `/language` to switch all bot prompts and buttons between English and
Khmer. The selected language is stored with the stream configuration.

Google Drive files are downloaded into `.data/cache` before FFmpeg starts.
The sharing setting must allow access without signing in. Telegram uploads are
stored under `.data/uploads`. Runtime configuration is saved in
`.data/stream-config.json`; these paths and their secrets are git-ignored.

Set `AUTO_START=true` only when the saved or environment configuration should
begin broadcasting immediately when the Node.js process starts. The default
is manual start through Telegram.

# Using NPM for simple and dev any code
![using npm js](https://github.com/hajilok/youtube-live-streaming/assets/120608486/456842fb-7df6-4114-a4a3-de46b4aedaf9)

**Just Need To Install Modules ffmpeg and enjoy with simple command :**

Npmjs : [https://www.npmjs.com/package/youtube-live-streaming](https://www.npmjs.com/package/youtube-live-streaming)

**Firts one :**
```
sudo apt update
sudo apt install ffmpeg
```
**Step 2 :**

**Install Node js**

```
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs
```
**Create file  ```index.mjs``` And Install module using this In terminal :**

```
npm i youtube-live-streaming
```
**And Paste This Simple Code  to your File  ```index.mjs``` :**

```
import youtube from "youtube-live-streaming";

const api = "jwze-rrs-tmwd-pwaz-a5m5"; //change with your streamkey
const video = "hajilok.mov"; //change with your video file name or video link 
const audio = "https://stream.zeno.fm/ez4m4918n98uv"; //change with your mp3 link or audio file name  

youtube(api, video, audio);
```
**or**

```
import youtube from "youtube-live-streaming";

const data = {
   api: "jwze-rrs-tmwd-pwaz-a5m5",
   video: "hajilok.mov",
   audio: "https://stream.zeno.fm/ez4m4918n98uv",
}

youtube(data.api, data.video, data.audio);
```

**Save You file and run in terminal with ```node index.mjs```**

**Note :**
_if not working or show any error plz ignore , check in youtube for your livestreaming is working or not because is module need any developetment , you can contribute with me_

_plz install express js and ffmpeg in your sistem if need using this module_

Link Github :_[ https://github.com/hajilok/youtube-live-streaming](https://github.com/hajilok/youtube-live-streaming)_


## Example in this case,  I Using Codespace on github For Start Livestream


![proft livestream menggunakan node js](https://github.com/hajilok/youtube-live-streaming/assets/120608486/6e400904-89c3-4635-b685-01e3aa48f481)

## In case I will try to deploy and run livestreaming  wit render 
![in the case deply with render](https://github.com/hajilok/youtube-live-streaming/assets/120608486/9227bf97-0080-4e2b-9a61-20b351469272)

## in case  i using cirleci ci/D for streaming in my youtube channel 
![cirleci streaming yt](https://github.com/hajilok/youtube-live-streaming/assets/120608486/ddcae854-6591-45d3-ad50-b50ec58eefa8)

## In case I Will Create Livestreaming Radio Ncs Song With Gitlab CI/CD

![deploy with gitlab](https://github.com/hajilok/youtube-live-streaming/assets/120608486/0af8509b-9d60-4f26-a709-cade74639755)

## And Finally With Bitbucket Pipelines :

![create livestreaming with bitbucked](https://github.com/hajilok/youtube-live-streaming/assets/120608486/76197d6a-3acb-4454-986b-060cba63697e)


## Is proof Live streaming with this Project with render hosting and run 24 hours nonstop if my render is not suck 😂

**Link Live Youtube for result of this project and listening music ncs  :** [https://www.youtube.com/live/PfrvJBagIUc?si=LnTiU2CAAoo8LonV](https://www.youtube.com/live/PfrvJBagIUc?si=LnTiU2CAAoo8LonV)

**Tutorial How To Use and Deploy To Render Hosting** :

**Clichttps://www.youtube.com/live/PfrvJBagIUc?si=LnTiU2CAAoo8LonVhttps://www.youtube.com/live/PfrvJBagIUc?si=LnTiU2CAAoo8LonVk Link This :**

_[https://www.youtube.com/watch?v=0oz94rCzf7A](https://www.youtube.com/watch?v=0oz94rCzf7A)_

## Deploy On 

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

**If Need Depploy to render or any hosting using main.js file and edit  on line 7 for your video art  content like lofi girl and plz add your .env if you need to deploy on render or any hosting**

**Example**
 ```
  streamkey = " " your screet key live in youtube

 ```
**In This You can get Stream Key On Youtube**

![kuncistrey](https://github.com/hajilok/youtube-live-streaming/assets/120608486/5b5e0a14-b810-4b08-96aa-ead17f863c59)

## Note :
**in this repository , you dont not need audio lofi because me have add in default with link audio lofi if you need livestream with content 24/7 hours nonstop lofi hiphop**

**update command ffmpeg in vaiabel " command " with your command ffmpeg for better result and any content live streaming never working**


# How To Deploy or using this Projects :

## Deploy Using CirlecI Ci/D 

**This A simple , Just Need too Fork this project and**
**Copy this Yaml File and paste : :**
```
version: 2.1

jobs:
  build:
    machine:
      image: ubuntu-2204:2023.10.1
    steps:
      - checkout
      - run: sudo apt-get update -y  && sudo apt-get install nodejs -y

      - run:
          name: cloning github
          command: git clone https://github.com/hajilok/youtube-live-streaming && cd youtube-live-streaming 
      
      - run:
          name: Install Node.js dependencies
          command: npm install
      
      # Store .env file
      - run:
          name: Store .env file
          command: echo 'streamkey=jtze-r9se-tm7d-p8yez-a5m5' > .env

      # Run your Node.js app
      - run:
          name: Run Your Node.js App
          command: node main.js  # Replace with your Node.js application's entry point


workflows:
  version: 2
  build-deploy:
    jobs:
      - build


```
_**Note : ```jtze-r9se-tm7d-p8yez-a5m5``` Replace With your key streaming in Youtube**_

## Deploy With Gitlab CI/CD :

 **This A simple , Fork My Gitlab Repository and Copy This Yaml File and Paste to Editor Pipeline**
 
 **Links Gitlab Repository :** _[https://gitlab.com/yukikatodo/youtube-live-streaming](https://gitlab.com/yukikatodo/youtube-live-streaming)_

 ```
 stages:
  - build

variables:
  STREAM_KEY: jwze-r5ss-tm8d-p0az-a5d3

before_script:
  - apt-get update -y
  - apt-get install -y ffmpeg
  - apt-get install -y nodejs
  - apt-get install -y npm
  - npm install


build:
  stage: build
  script:
    - echo "streamkey=$STREAM_KEY" > .env
    - node main.js

 ```

_**In Variabels Stream Key Replace with Your streamkey in youtube**_

## Deploy With Bitbucket Pipelines CI/CD :

**Link Bitbucket :** _[https://bitbucket.org/gohashindi/youtube-live-streaming](https://bitbucket.org/gohashindi/youtube-live-streaming)_

**Simple You Need To Fork This Link Bitbucket And Edit In Pipelines Yaml With This :**
```
#  Template NodeJS build

#  This template allows you to validate your NodeJS code.
#  The workflow allows running tests and code linting on the default branch.

image: ubuntu

pipelines:
  default:
    - parallel:
        - step:
            name: Build and Test
            deployment: production
            caches:
              - node
            script:
              - apt-get update -y 
              - apt-get install ffmpeg -y
              - apt-get install nodejs npm -y
              - echo "streamkey=jwze-r5ss-tm8d-p0az-a5d3" > .env
              - npm install
              - node main.js
        

```

_**Replace This ```jwze-r5ss-tm8d-p0az-a5d3``` Your Stream Key in youtube**_

## Deploy Manual on Your Os system

### Requirement 
```
ffmpeg
node js with new version

```
**How To Install :**

**Note : On build command on render or any hosting site using node main.js**

```
sudo su - 
apt install ffmpeg ( install if you dont have ffmpeg in your system or you using codespace in github you need to install with this command on terminal with user root  )
npm install ( to install any package required on node js in codespace auto installing )
node main.js or  node index.js 


```
