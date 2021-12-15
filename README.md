# discord-musix-bot

## Getting Started

-   Install nodejs LTS (v16) version

        cd ~
        curl -sL https://deb.nodesource.com/setup_16.x -o nodesource_setup.sh
        sudo bash nodesource_setup.sh
        sudo apt-get install -y nodejs
        rm nodesource_setup.sh

-   Update NPM and install yarn

        sudo npm install -g npm
        sudo npm install yarn -g

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
