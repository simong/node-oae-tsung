# OAE Tsung Runner Module

This module can be used to generate Tsung performance tests for Hilary.

## Instructions

First, you'll want to run `node main.js --help` to see available options. Simply running `node main.js` will start the interactive prompt that will let you generate a very basic Tsung test file. For the test suite, choose `standard` for a standard test suite (see the `suites/` directory for more options).

To configure data for the test, have a look at the instructions inside `config/data.json` to learn how to set up dynamic variables and CSV data that can be used to drive the performance test.
