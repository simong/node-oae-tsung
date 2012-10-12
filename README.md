# OAE Tsung Runner Module

This module can be used to generate Tsung performance tests for Hilary.

## Instructions

First, install this module globally:

`npm install -g http://github.com/mrvisser/node-oae-tsung`

Now, if you run:

`oae-tsung`

You will get the interactive prompt to generate a very simple test case. Use `standard` as the suite (more suites available in the `suites/` directory of this repo. Run `oae-tsung --help` to get more options.

To configure data for the test, have a look at the instructions inside `config/data.json` to learn how to set up dynamic variables and CSV data that can be used to drive the performance test. You can clone the repository, update the config, and run `node main.js` for custom tests.
