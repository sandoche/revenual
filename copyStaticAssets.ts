import * as shell from 'shelljs'

shell.cp('-R', 'src/public/js/lib', 'dist/public/js/')
shell.cp('-R', 'src/public/fonts', 'dist/public/')
shell.cp('-R', 'src/public/images', 'dist/public/')
shell.cp('-R', 'src/public/css/DataTables-1.10.20', 'dist/public/css/')
shell.cp('-R', 'temp', 'dist/')
shell.cp('-R', 'templates', 'dist/')
