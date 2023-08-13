# ReadME.md

```bash=
npm start
```
http://localhost:3000/

## build docker yourself
```bash=
npm run build
docker build . -t archeryfrontend:[version] -f ./start
docker run -p [localport]:80 archeryfrontend:[version]
```

## pull from dockerhub
```bash=
docker image pull rain72510/archeryfrontend:logined
docker run -p [port]:80 rain72510/archeryfrontend:logined
```
