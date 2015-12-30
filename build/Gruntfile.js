// explained here: 
// http://www.codebelt.com/javascript/install-grunt-js-on-windows/


module.exports = function( grunt ){
     // Project configuration.
    grunt.initConfig({
         //Read the package.json (optional)
        pkg: grunt.file.readJSON('package.json'),
        // Metadata.
        meta: {
            basePath: '../',
            srcPath: '../src/ximpel/',
            deployPath: '../deploy/ximpel/'
        },
 
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> ',
 

        clean: ['<%= meta.deployPath %>'],


        // Task configuration.
        concat: {
            options: {
                stripBanners: true
            },
            dist: {
                src: [
                    '<%= meta.srcPath %>polyfills.js', 
                    '<%= meta.srcPath %>ximpel.js', 
                    '<%= meta.srcPath %>View.js', 
                    '<%= meta.srcPath %>Models.js', 
                    '<%= meta.srcPath %>XimpelApp.js', 
                    '<%= meta.srcPath %>Player.js', 
                    '<%= meta.srcPath %>Parser.js', 
                    '<%= meta.srcPath %>MediaPlayer.js', 
                    '<%= meta.srcPath %>QuestionManager.js', 
                    '<%= meta.srcPath %>SequencePlayer.js', 
                    '<%= meta.srcPath %>MediaType.js', 
                    '<%= meta.srcPath %>MediaTypeRegistration.js', 
                    '<%= meta.srcPath %>PubSub.js', 

                    '<%= meta.srcPath %>XimpelAppView.js', 
                    '<%= meta.srcPath %>OverlayView.js', 
                    '<%= meta.srcPath %>QuestionView.js', 

                    '<%= meta.srcPath %>Video.js',
                    '<%= meta.srcPath %>Image.js',
                    '<%= meta.srcPath %>Audio.js',
                    '<%= meta.srcPath %>YouTube.js'
                ],
                dest: '<%= meta.deployPath %>ximpel.js'
            }
        },

        copy: {
            main: {
                files: [
                    { expand: true, cwd: '<%= meta.srcPath %>', src: ['ximpel.css'], dest: '<%= meta.deployPath %>'},
                    { expand: true, cwd: '<%= meta.srcPath %>', src: ['images/*'], dest: '<%= meta.deployPath %>'}
                ],
            },
        }


    });
 
    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');

 
    // Default task
    grunt.registerTask('default', ['clean','concat','copy']);
 
};