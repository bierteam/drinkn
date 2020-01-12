[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

| Branch | Status | Coverage | Quality |
| --- | --- | --- | --- |
| Master: | [![Build Status](https://travis-ci.com/bierteam/Pils.svg?branch=master)](https://travis-ci.com/bierteam/Pils) | [![codecov](https://codecov.io/gh/bierteam/Pils/branch/master/graph/badge.svg)](https://codecov.io/gh/bierteam/Pils) | [![codebeat badge](https://codebeat.co/badges/8f7668ab-0b6f-4a88-b5c9-ba4e47171a2d)](https://codebeat.co/projects/github-com-bierteam-pils-master)
| Dev: | [![Build Status](https://travis-ci.com/bierteam/Pils.svg?branch=dev)](https://travis-ci.com/bierteam/Pils) | [![codecov](https://codecov.io/gh/bierteam/Pils/branch/dev/graph/badge.svg)](https://codecov.io/gh/bierteam/Pils) | [![codebeat badge](https://codebeat.co/badges/8f7668ab-0b6f-4a88-b5c9-ba4e47171a2d)](https://codebeat.co/projects/github-com-bierteam-pils-dev)

# Pils

A simple node app to get some usable data from [biernet.nl](https://biernet.nl/)
We will consume this data later to generate push notifications with nice discounts when the fridge is running low for example.

## Getting Started

These instructions will get you a copy of the project up and running.

### Prerequisites

What things you need to install the software

```
git
node
docker (optional)
A MongoDB database
```

### Installing *Git*

> *Git* is a [free and open source](http://git-scm.com/about/free-and-open-source) distributed version control system designed to handle everything from small to very large projects with speed and efficiency.

The [*Git* website](http://git-scm.com/)

### Installing *Node* 

[Install instructions](https://www.linode.com/docs/development/version-control/how-to-install-git-on-linux-mac-and-windows/)

### Installing *Docker* 

[Install instructions](https://docs.docker.com/install/)

### Using *MongoDB* 

There are many options here, but we recommend the free Mongo Atlas tier: [Link](https://www.mongodb.com/download-center/cloud
)

## Installing project for development

A step by step series of examples that tell you how to get a copy running.

Clone the repo

```
git clone https://github.com/bierteam/Pils.git
```

Go to the directory

```
cd Pils
```

Install project

```
npm install
```

Copy and fill config file

```
cp .example.env .env
```
Run development servers
```
npm run dev-front
```
Second terminal 
```
npm run dev-back
```
## Installing project for production
### Option 1: Docker
This is the most simple way to run the project.
#### Option 1.1: Run our build
```
docker run --env-file .env --restart always --detach --publish 3000:3000 bierteam/pils:dev
```
#### Option 1.2: Build your own
```
docker build . -t pils
docker run --env-file .env --restart always --detach --publish 3000:3000 pils
```

### Option 2: [PM2](https://pm2.keymetrics.io/)
A simple node process manager that handles crashes etc.
```
npm run build
npm install pm2 -g
pm2 start server.js
```

### Option 3: Node + screen
Also a very simple way to run the project, but it doesn't account for crashes etc.
```
npm run build

node server.js
```

## Authors

* **Nino Van der Laan** - [NvdLaan](https://github.com/NvdLaan)
* **Oscar Wieman** - [Oscrx](https://github.com/oscrx)

Other [contributors](https://github.com/bierteam/Pils/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
