# discord-musix-bot

## Getting Started

-   Install nodejs LTS (v20) version [link](https://github.com/nodesource/distributions)
-   Update NPM and use yarn classic from npm corepack global

        node -v # v20.10.0
        npm -v # 10.2.4
        yarn -v # 1.22.19

-   Install python3.8

        sudo add-apt-repository ppa:deadsnakes/ppa
        sudo apt-get update
        sudo apt install python3.8
        sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.8 1
        sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.5 2
        sudo update-alternatives --config python3

-   Install yt-dlp

        sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
        sudo chmod a+rx /usr/local/bin/yt-dlp
        sudo vim /usr/local/bin/yt-dlp # update python version to 3.8
        sudo apt-get install ffmpeg

-   Do yarn install inside repo
-   get Token from `https://discord.com/developers/applications/<id>/bot`
-   run using `TOKEN=<token> yarn run start`
-   solution for puppeteer error [link1](https://medium.com/@ssmak/how-to-fix-puppetteer-error-while-loading-shared-libraries-libx11-xcb-so-1-c1918b75acc3) [link2](https://techoverflow.net/2018/06/05/how-to-fix-puppetteer-error-while-loading-shared-libraries-libx11-xcb-so-1-cannot-open-shared-object-file-no-such-file-or-directory/)
