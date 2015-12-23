README
----------------------------------------------------------------------------
XIMPEL consist of many different javascript files during development. However in a live 
environment we want XIMPEL to consist of one single script: "ximpel.js" both for simplicity
and for performance. To achieve this we use GruntJs.

GruntJs is a task runner tool that runs on NodeJs. It can minify CSS/JavaScript, run linting 
tools (JSHint, JSlint, CSSlint), concatenate multiple files into one, deploy to server, run 
test cases and more.


Building XIMPEL:
--------------------------------------
1. 	First install NodeJs from here: 
		https://nodejs.org/en/
	When NodeJs is installed, the Node Package Manager is available (the "npm" command line utility)

2. 	Then we install Grunt's command line interface using the Node Package Manager:
		npm install grunt-cli -g

3. 	Within our <project-dir>/build folder (ie. the same folder as where this README.txt file is located)
	there is a "package.json" file. This file specifies the dependencies for our build process that the
	Node Package Manager will install when executing:
		npm install
	These dependencies are downloaded into our <project-dir>/build folder. In our case the dependencies 
	are "grunt v0.4.1" itself and the grunt plugins we need. 

4. 	Within our "<project-dir>/buildbuild" folder we have placed a "Gruntfile.js". This gruntfile specifies
	the tasks that Grunt needs to perform to build XIMPEL. When we want to build XIMPEL we simply execute 
	the command:
		grunt
	This makes Grunt perform the building process based on whats specified in "Gruntfile.js".