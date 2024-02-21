# Segment Function Sync

## GitHub Version Control for Segment Functions

This repository is a template repository that includes GitHub Action automations to automatically create and update *Segment Functions* via the Segment Public API.

Unlike similar repositories, the automation within this repository automatically detects functions within the repository, identifies them on Segment (if they exist), and either updates or creates them accordingly. There is no need to manually configure each function in the YAML or anywhere else.

### Usage

1. Clone the repository as is, create a new repository from this template, or copy it's entire contents barring this README and the LICENSE file into your repository.
2. You must setup your repository with a `SEGMENT_TOKEN` secret containing an API key for the Segment Public API.

The repository has three directories representing the different types of Segment Functions:

1. `source` - Source Functions
2. `destination` - Destination Functions
3. `insert` - Destination Insert Functions

You must place your files into the correct folder that corresponds with the function type. 

**The first line of all files MUST contain a comment with the function display name (as shown in Segment UI), like so:**

```
// FUNCTION_NAME: Test Function

// Your Code Here
```

The automation within `.github/workflows/updateOrCreateFunction.js` will attempt to see if there is a matching function within segment based on the function name and type. If yes, it will update that function. If no, it will create a new function. Afterwards, it will deploy the function.

By default the `main.yml` is configured to do this on the `main` or `master` branches.
