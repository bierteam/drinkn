[![Coverage Status](https://coveralls.io/repos/github/bierteam/Pils/badge.svg?branch=dev)](https://coveralls.io/github/bierteam/Pils?branch=dev)
[![codebeat badge](https://codebeat.co/badges/8f7668ab-0b6f-4a88-b5c9-ba4e47171a2d)](https://codebeat.co/projects/github-com-bierteam-pils-dev)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

| Branch | Status |
| --- | --- |
| Master: | [![Build Status](https://travis-ci.com/bierteam/Pils.svg?branch=master)](https://travis-ci.org/bierteam/Pils) |
| Dev: | [![Build Status](https://travis-ci.com/bierteam/Pils.svg?branch=dev)](https://travis-ci.org/bierteam/Pils) |

# Pils

A simple node app to get some usable data from [biernet.nl](https://biernet.nl/)
We will consume this data later to generate push notifications with nice discounts when the fridge is running low for example.

## Getting Started

These instructions will get you a copy of the project up and running.

### Prerequisites

What things you need to install the software and how to install them

```
git
node
```
### Installing *Git* – the easy way

> *Git* is a [free and open source](http://git-scm.com/about/free-and-open-source) distributed version control system designed to handle everything from small to very large projects with speed and efficiency.

– The [*Git* website](http://git-scm.com/)

Choose one of the following options.
- [Instructions for *Windows*](windows.md)
- [Instructions for *Mac*](mac.md)
- [Instructions for *Linux*](linux.md)

### Installing Node in 5 minutes: The Final Guide.

~~If you have shitty internet, it may take a little longer.~~
- [Install instructions](node.md)

## Installing

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
cp config/backend.example.js config/backend.js
```
Run development servers
```
npm run dev
```
Second terminal 
```
npm run nodemon
```
Run production server (I suggest [pm2](https://www.npmjs.com/package/pm2) instead)
```
npm run build

node server.js
```
## Authors

* **Nino Van der Laan** - *Initial work* - [NvdLaan](https://github.com/NvdLaan)
* **Oscar Wieman** - *Initial work* - [Oscrx](https://github.com/oscrx)

See also the list of [contributors](https://github.com/NvdLaan/Pils/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* [Git guide](https://gist.github.com/derhuerst/1b15ff4652a867391f03)
* [Node guide](https://gist.github.com/kazzkiq/fe702215173e795d49d0c1ffbea363b5)
* [README Template](https://gist.github.com/PurpleBooth/109311bb0361f32d87a2)
