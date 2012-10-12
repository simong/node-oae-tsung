# Configuration

## data.json

Data configuration file for a tsung test. You can configure various types of dynamic data that is wired into your tsung test.

### CSV File Data

Configured using a `files` object. The key of each file is the expected file name (before ".csv"), and is also used as the file
ID in the Tsung test. Each variable name in the vars array enumerates each column in the CSV file, and is expected to be in
proper order. The order specifies in what order the rows will be read from the CSV file (`iter` or `random`).

**Note:** This file data format spec should be in line with the structure of the CSV files generated in `lib/gendata.js`

Example:

```
"files": {
    "users": {
        "order": "random",
        "vars": [ "first_name", "last_name", "display_name" ]
    }
}
```

### Random Strings

Configured using a `strings` object:

```
"strings": {
    "_str_random_med": {
        "length": 50
    }
}
```

### Random Numbers

```
"numbers": {
    "_num_random": {
        "start": 0,
        "end": 100
    }
}
```
