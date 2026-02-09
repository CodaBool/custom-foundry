# Release flow
1. push to main
2. git tag -a v3.2.4 -m ""
3. git push -u origin v3.2.4
4. watch [actions](https://github.com/CodaBool/maps-in-cyberspace/actions)
5. verify installation with a foundry docker locally


## Local Testing
1. run the script below, get the secret value from terminal private notes, since it uses a secret
```sh
cp module.json module.backup.json
jq 'del(.protected) | .manifest = "GET_VALUE_FROM_TERMINAL_NOTES"' module.json  > temp_file && mv temp_file module.json
zip -r terminal.zip .
bunx wrangler r2 object put module/terminal-v0.0.0 -f terminal.zip --ct application/zip --cc public
mv module.backup.json module.json
rm terminal.zip
```
2. install using manifest URL `GET_VALUE_FROM_TERMINAL_NOTES`


# todo
- add scripting journal with bootstrap pages
- pixelate doesn't seem to work
- where is theatre?
- const tile4 = fromUuidSync(`Scene.${canvas.scene.id}.Tile.SCgLTPY1W6Mcwkxi`)
