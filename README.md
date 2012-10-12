# OAE Tsung Runner Module

This module can be used to generate Tsung performance tests for Hilary.

## Instructions

First, install this module globally (you'll need git installed):

`npm install -g git://github.com/mrvisser/node-oae-tsung`

Now, assuming global NPM module binaries end up on your PATH, if you run:

`oae-tsung`

You will get the interactive prompt to generate a very simple test case. Use `standard` as the suite (more suites would be available in the `suites/` directory of this repo). Run `oae-tsung --help` to get more options.

To configure data for the test, have a look at the instructions in the `config/` readme to learn how to set up dynamic variables and CSV data that can be used to drive the performance test. You can clone the repository, update the config, and run `node main.js` for custom tests.
