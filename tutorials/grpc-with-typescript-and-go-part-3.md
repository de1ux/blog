In [part 2](/tutorials/grpc-with-typescript-and-go-part-2) we implemented the service. Let's write a Typescript client to complete the app.

Geting the Typescript setup out of the way
```bash
$ tsc --init
$ npm i --save grpc-web-client
$ npm i --save-dev webpack@4 webpack-cli@4 awesome-typescript-loader typescript @types/google-protobuf
```

Quick webpack config for transpilation to Javascript
```js
const webpack = require('webpack');

module.exports = function makeWebpackConfig() {
    let config = {};

    config.entry = {
        index: "./index.ts",
    };

    config.devtool = 'eval-source-map';

    config.resolve = {
        extensions: [".ts", ".js"]
    };

    config.module = {
        rules: [
            {test: /\.ts?$/, loader: "awesome-typescript-loader"}
        ]
    };

    return config;
}();
```

Write an index.html and index.ts that will serve as our app
```html
<div id="root"></div>
<script src="dist/index.js"></script>
```

```typescript
document.getElementById('root').innerHTML = "Hi from TS";
```

To prevent issues with CORS, the Go service will serve both gRPC and our frontend static resource..

Jumping back to `main.go`, if a request is for gRPC, grpc-web will automatically add the `Content-Type: application/grpc`. Everything else we can treat as a request for static resources.

The `http.Server` handler in `main.go` would look something like this

```go
if err := (&http.Server{
    Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if strings.Contains(r.Header.Get("Content-Type"), "application/grpc") {
            wrappedGrpcServer.ServeHTTP(w, r)
        } else {
            http.FileServer(http.Dir(".")).ServeHTTP(w, r)

        }
    }),
    Addr:    "0.0.0.0:9999",
}).ListenAndServe(); err != nil {
    log.Fatal(err)
}
```

Quick test that the static resources are served correctly on http://localhost:9999/index.html
```bash
$ ./node_modules/.bin/webpack -w &
$ go run main.go
```

![hi from ts](/images/gwtagp3-0.png)

### Typescript gRPC call

Always saving the best for last, lets call `GetLogs` with the browser and display the result.

```typescript
import {GetLogsRequest, GetLogsResponse} from './generated/service_pb';
import {LogServiceClient, ServiceError} from './generated/service_pb_service';

let root = document.getElementById('root');

let client = new LogServiceClient('http://localhost:9999'),
    request = new GetLogsRequest();
request.setPodname('pod/random-logger-7f68f7949-88zrw');

client.getLogs(request, (err: ServiceError | null, logs: GetLogsResponse | null) => {
    if (!root) {
        throw new Error('Failed to find root');
    }
    if (err) {
        root.innerHTML = 'Error: ' + err.message;
        return;
    }
    if (!logs) {
        root.innerHTML = 'No logs';
        return;
    }

    logs.getDataList().map(log => {
        if (!root) {
            throw new Error('Failed to find root');
        }
        let pEl = document.createElement('p');
        pEl.innerHTML = log;
        root.appendChild(pEl);
    });
});
```

Which outputs

![hi from logs](/images/gwtagp3-1.png)
