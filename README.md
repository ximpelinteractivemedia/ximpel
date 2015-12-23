# README #

Within the repository there are a number of folders:
* The 'src' folder this contains all the source files of ximpel
* The 'documentation' folder contains the ximpel documentation. (open index.htm)
* The 'build' folder contains everything needed to build XIMPEL into a deployable package. (See the README within this build folder for details on how to build).

### How do I get set up? ###

1. Checkout this repository using:
git clone https://sbruinsje@bitbucket.org/sbruinsje/ximpel.git

2. Go to the build folder and follow the readme. In summary the README says:
        * download and install nodeJs (https://nodejs.org/en/)
        * Open a command prompt and execute: `npm install grunt-cli -g` then restart the command prompt.
        * In the command prompt change directory to the "build" directory and execute: `npm install`
        * Then execute: `grunt`

3. After building XIMPEL a deploy directory has been created in the repository root folder. In this deploy directory there
   is a "ximpel" directory which contains our XIMPEL build.
   
4. Open the index.htm in the documentation folder. Then follow the getting_started guide of the documentation.