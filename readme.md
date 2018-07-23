# Getting started

npm install
npm run build

# Dependencies

See package.json
images folder is included as required by worldwind: https://worldwind.arc.nasa.gov/web/get-started/

layout based on https://getbootstrap.com/docs/4.1/examples/dashboard/

# Todo

- set up simple rest interface: https://github.com/typicode/json-server (currently, there's also duplication of aspect names in indicators.json and aspects.json)
- use html-webpack-template https://github.com/jaketrent/html-webpack-template and more sofisticated features of https://github.com/jantimon/html-webpack-plugin ?
- distiniguish between development and production mode (especially choose proper devtool https://webpack.js.org/guides/development/)
- work through the whole webpack guide (especially file size, minification, code splitting)
- vagrant?
- import only individual bootstrap plugins: https://getbootstrap.com/docs/4.0/getting-started/webpack/, maybe also use _custom.scss to override defaults and use sass-files
- use font awesome as npm package instead of feathers?
- use charts? and tables as in dashboard layout?
- shapefiles should map granularity of source (e.g. ilo estimates for child labor only for africa, europe etc...)
- make year reflect the age of used data, not date or report

# Read
http://www.undatarevolution.org/wp-content/uploads/2014/11/A-World-That-Counts.pdf

Country Codes:
https://unstats.un.org/unsd/methodology/m49/