es5 = require('es5-shimify')

str = {
    "Bootstrap" : true
    "js" : true
    "loaded!" : true
}

$("#appjs").text( Object.keys(str).join(" ") )

