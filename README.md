# OAE Tsung Runner Module

This module can be used to generate Tsung performance tests for Hilary.

**Prerequisites:**

* You have (nodejs)[http://nodejs.org/] installed
* You have (tsung)[http://tsung.erlang-projects.org/] installed
* You have generated OAE data with the (OAE Model Loader)[http://github.com/sakaiproject/OAE-model-loader] (Hilary branch) project

## Basic Instructions

### 1. Install this module

`npm install -g git://github.com/mrvisser/node-oae-tsung`

After installation, make sure `oae-tsung` binary is on your PATH.

### 2. Run oae-tsung

Run `oae-tsung --help` to start. If your test uses data that was generated from the OAE-model-loader, point `-s` to the `scripts/` directory that loaded that content.

### 3. Run Tsung

The utility will let you know which directory contains the Tsung test package. `cd` to that package and run `tsung -f tsung.xml start` to run the Tsung test.
