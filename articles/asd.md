

One of the best tools for diagnosing failed Kubernetes deployments is with the log viewer, `kubectl logs`.

But direct `kubectl logs` may be restricted to Ops if your organization doesn't allow engineers access to the Kubernetes cluster.

Or, our end users might not be engineers at all, but still want something to send along with a report.

So lets build a convenient webapp that lets anyone with a browser have the same functionality as `kubectl logs`.

Requests to the webapp will be routed from the browser to a Go service over gRPC. Then Go will make API requests to the kube api-server.

```[ Browser ] -> [ Go service ]-> [ Kube api-server ]```

The Go service could eventually bolt on business rules, auth, etc.

### Messaging

The gRPC messages the browser will use to request logs from the Go service must be defined:

```protobuf
syntax="proto3";

message Empty {}

message Logs {
  repeated string data = 1;
}

service LogService {
  rpc GetLogs(Empty) returns (Logs);
}
```

If you don't already have `protoc` available in your $PATH, install it from the [releases page](https://github.com/protocolbuffers/protobuf/releases).

And then install the language-specific plugins
```bash
# Install the protobuf plugin for Go
$ go mod init
$ go get -u github.com/golang/protobuf/protoc-gen-go

# Install the protobuf plugin for Typescript
$ npm init
$ npm i --save-dev ts-protoc-gen
```

Now we can run `protoc` on the protobuf definitions

```bash
# Make a folder for the output
$ mkdir generated
$ protoc \
    --plugin="protoc-gen-ts=node_modules/ts-protoc-gen/bin/protoc-gen-ts" \
    --ts_out="service=true:generated" \
    --go_out="plugins=grpc:generated" \
    service.proto
```

and see some generated client/server code in the `generated` folder:
```bash
$ ls -ltr generated
total 40
-rw-r--r--  1 nathanevans  staff  1455 Nov 22 21:12 service_pb_service.js
-rw-r--r--  1 nathanevans  staff  2065 Nov 22 21:12 service_pb_service.d.ts
-rw-r--r--  1 nathanevans  staff  1562 Nov 22 21:12 service_pb.d.ts
-rw-r--r--  1 nathanevans  staff  5804 Nov 22 21:12 service.pb.go
```

Let's move on to the backend!

### Go service

Here's some code for the backend service, with stubs filled in for the kube-api-server bits.

```go
package main

import (
    "context"
    "log"
    "net/http"

    "github.com/improbable-eng/grpc-web/go/grpcweb"
    api "gitlab.com/de1ux/blog_examples/grpc-with-typescript-and-go/generated"
    "google.golang.org/grpc"
)

type service struct{}

func (service) GetLogs(context.Context, *api.Empty) (*api.Logs, error) {
    panic("implement me")
}

func main() {
    grpcServer := grpc.NewServer()

    api.RegisterLogServiceServer(grpcServer, &service{})

    wrappedGrpcServer := grpcweb.WrapServer(grpcServer)

    log.Print("Accepting requests...")
    if err := (&http.Server{
        Handler: wrappedGrpcServer,
        Addr:    "0.0.0.0:9999",
    }).ListenAndServe(); err != nil {
        log.Fatal(err)
    }
}

```

`main.go` does a few things
* Implements the service interface we generated from our protobuf (my IDE did this automatically)
* Creates a server
* Registers the service implementation with the server
* Wraps the server with gRPC-web functionality ([docs](https://github.com/improbable-eng/grpc-web/tree/master/go/grpcweb))

### Next

In the next part, we'll write something useful for the GetLogs endpoint and build the frontend.



